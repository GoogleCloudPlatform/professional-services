/*
#   Copyright 2022 Google LLC
#
#   Licensed under the Apache License, Version 2.0 (the "License");
#   you may not use this file except in compliance with the License.
#   You may obtain a copy of the License at
#
#       http://www.apache.org/licenses/LICENSE-2.0
#
#   Unless required by applicable law or agreed to in writing, software
#   distributed under the License is distributed on an "AS IS" BASIS,
#   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
#   See the License for the specific language governing permissions and
#   limitations under the License.
#
*/
package gcpviz

import (
	"bufio"
	"bytes"
	"context"
	"encoding/binary"
	"encoding/gob"
	"encoding/json"
	"fmt"
	"io"
	"io/ioutil"
	"log"
	"net"
	"os"
	"reflect"
	"strconv"
	"strings"
	"sync"
	"time"

	"github.com/cayleygraph/cayley"
	"github.com/cayleygraph/cayley/graph"
	"github.com/cayleygraph/cayley/query"
	"github.com/cayleygraph/cayley/query/gizmo"
	cquad "github.com/cayleygraph/quad"
	"github.com/gogo/protobuf/proto"
	"github.com/pkg/errors"

	"github.com/forseti-security/config-validator/pkg/api/validator"
	cvasset "github.com/forseti-security/config-validator/pkg/asset"
	"github.com/golang/protobuf/jsonpb"
	"github.com/yalp/jsonpath"
	"gopkg.in/yaml.v3"

	"text/template"

	"github.com/boltdb/bolt"
	_ "github.com/cayleygraph/cayley/graph/kv/bolt"
	"github.com/mitchellh/go-wordwrap"
	"github.com/tidwall/sjson"
	"github.com/willf/bloom"
)

type GcpViz struct {
	QS            graph.QuadStore
	QW            graph.QuadWriter
	Relations     ResourceRelations
	AssetDatabase *bolt.DB
	Assets        *bolt.Bucket
	Aliases       *bolt.Bucket
	Graph         *bolt.Bucket
	transaction   *bolt.Tx
	bfilter       *bloom.BloomFilter

	OrgRoots []string

	TotalVertexes int64
	TotalEdges    int64
	TotalAliases  int64
	TotalIps      int64
}

type TemplateResourceResource struct {
	Data                 interface{} `json:"data"`
	DiscoveryDocumentUri string      `json:"discovery_document_uri"`
	DiscoveryName        string      `json:"discovery:name"`
	Version              string      `json:"version"`
	Parent               string      `json:"parent"`
}

type TemplateResource struct {
	Name      string                   `json:"name"`
	AssetType string                   `json:"asset_type"`
	Resource  TemplateResourceResource `json:"resource"`
	Ancestors []string                 `json:"ancestors"`
}

type ResourceRelations struct {
	AssetTypes  map[string][]jsonpath.FilterFunc
	Aliases     map[string][]jsonpath.FilterFunc
	Enrich      map[string]map[string]map[string]jsonpath.FilterFunc
	IpAddresses map[string][]jsonpath.FilterFunc
}

type RawResourceRelations struct {
	AssetTypes  map[string][]string                     `yaml:"asset_types"`
	Aliases     map[string][]string                     `yaml:"aliases"`
	Enrich      map[string]map[string]map[string]string `yaml:"enrich"`
	IpAddresses map[string][]string                     `yaml:"ip_addresses"`
}

type GraphStyle struct {
	Global  map[string]string            `yaml:"global" json:"global"`
	Options map[string]string            `yaml:"options" json:"options"`
	Edges   map[string]map[string]string `yaml:"edges" json:"edges"`
	Nodes   map[string]string            `yaml:"nodes" json:"nodes"`
}

type NodeStyle struct {
	Label     string `json:"label"`
	HeadLabel string `json:"headLabel"`
	TailLabel string `json:"tailLabel"`
	Link      string `json:"link"`
	Resource  *TemplateResourceResource
}

type IpAddressLink struct {
	Ip        *net.IPNet
	Resource  string
	AssetType string
}

var Labels map[string]*template.Template
var HeadLabels map[string]*template.Template
var TailLabels map[string]*template.Template
var Links map[string]*template.Template
var Style GraphStyle
var Nodes map[string]*template.Template
var Edges map[string]map[string]*template.Template

var templateFuncMap = template.FuncMap{
	// The name "title" is what the function will be called in the template text.
	"GetLastPart":    GetLastPart,
	"GetPartFromEnd": GetPartFromEnd,
	"GetRegion":      GetRegion,
	"Join":           Join,
	"JoinNicely":     JoinNicely,
	"ToLower":        ToLower,
	"DaysLeft":       DaysLeft,
	"NotLast":        NotLast,
	"Replace":        Replace,
}

func NotLast(x int, a interface{}) bool {
	return x != reflect.ValueOf(a).Len()-1
}

func DaysLeft(s string) string {
	t, err := time.Parse(time.RFC3339, s)
	if err != nil {
		return "[error parsing time]"
	}
	duration := t.Sub(time.Now())
	if duration.Hours()/24 < 0.0 {
		return "0"
	}
	return fmt.Sprintf("%.0f", duration.Hours()/24)
}

func ToLower(s string) string {
	return strings.ToLower(s)
}

func Join(s []interface{}) string {
	strs := make([]string, len(s))
	for i, v := range s {
		strs[i] = fmt.Sprint(v)
	}
	return strings.Join(strs, ", ")
}

func JoinNicely(s []interface{}) string {
	strs := make([]string, len(s))
	for i, v := range s {
		strs[i] = fmt.Sprint(v)
	}
	return wordwrap.WrapString(strings.Join(strs, ", "), 80)
}

func GetLastPart(s string) string {
	sp := strings.Split(s, "/")
	return sp[len(sp)-1]
}

func GetPartFromEnd(s string, idx int) string {
	sp := strings.Split(s, "/")
	return sp[len(sp)-idx]
}

func GetRegion(s string) string {
	sp := strings.Split(s, "/")
	for i := 0; i < len(sp); i++ {
		if sp[i] == "regions" {
			return sp[i+1]
		}
	}

	return ""
}

func Replace(from string, to string, input string) string {
	return strings.Replace(input, from, to, -1)
}

func NewGcpViz(relationsFile string, labelsFile string, styleFile string, override map[string]string) (*GcpViz, error) {
	qs, _ := graph.NewQuadStore("memstore", "", nil)
	qw, _ := graph.NewQuadWriter("single", qs, nil)

	gcpViz := GcpViz{QS: qs, QW: qw}

	err := gcpViz.loadRelationsMap(relationsFile)
	if err != nil {
		return nil, fmt.Errorf("error loading relations map: %v", err)
	}
	err = gcpViz.loadLabelsMap(labelsFile)
	if err != nil {
		return nil, fmt.Errorf("error loading labels map: %v", err)
	}
	err = gcpViz.loadStyleMap(styleFile, override)
	if err != nil {
		return nil, fmt.Errorf("error loading styles map: %v", err)
	}
	return &gcpViz, nil
}

func (v *GcpViz) Create(dbFile string) error {
	db, err := bolt.Open(dbFile, 0600, nil)
	if err != nil {
		return err
	}
	v.AssetDatabase = db

	err = v.initializeBolt()
	if err != nil {
		return err
	}
	return nil
}

func (v *GcpViz) Load(dbFile string) error {
	if _, err := os.Stat(dbFile); os.IsNotExist(err) {
		return err
	}

	db, err := bolt.Open(dbFile, 0600, &bolt.Options{ReadOnly: true})
	if err != nil {
		return err
	}
	v.AssetDatabase = db

	tx, err := v.AssetDatabase.Begin(false)
	if err != nil {
		return err
	}
	defer tx.Rollback()
	v.Assets = tx.Bucket([]byte("Assets"))
	if v.Assets == nil {
		return errors.New("could not find bucket Assets in database")
	}
	v.Graph = tx.Bucket([]byte("Graph"))
	if v.Graph == nil {
		return errors.New("could not find bucket Graph in database")
	}
	v.Aliases = tx.Bucket([]byte("Aliases"))
	if v.Aliases == nil {
		return errors.New("could not find bucket Aliases in database")
	}

	rootBucket := tx.Bucket([]byte("Organizations"))
	if rootBucket == nil {
		return errors.New("could not find bucket OrgRoots in database")
	}
	orgRoots := rootBucket.Get([]byte("Roots"))
	buffer := bytes.NewReader(orgRoots)
	dec := gob.NewDecoder(buffer)
	for {
		err := dec.Decode(&v.OrgRoots)
		if err != nil {
			break
		}
	}

	var cstr cquad.String = "quad"
	gob.Register(cstr)

	graph := v.Graph.Get([]byte("Graph"))

	buffer = bytes.NewReader(graph)
	dec = gob.NewDecoder(buffer)

	for {
		var q cquad.Quad
		err := dec.Decode(&q)
		if err != nil {
			break
		}
		err = v.QW.AddQuad(q)
		if err != nil {
			break
		}
	}
	if err != io.EOF {
		return err
	}

	if err := tx.Rollback(); err != nil {
		return err
	}
	return nil
}

func (v *GcpViz) Save() error {
	// Insert resource to BoltDB
	tx, err := v.AssetDatabase.Begin(true)
	if err != nil {
		return err
	}
	defer tx.Rollback()

	ctx := context.Background()

	var orgBuffer bytes.Buffer
	enc := gob.NewEncoder(&orgBuffer)
	err = enc.Encode(v.OrgRoots)
	if err != nil {
		return err
	}

	err = tx.Bucket([]byte("Organizations")).Put([]byte("Roots"), []byte(orgBuffer.Bytes()))
	if err = tx.Commit(); err != nil {
		return err
	}

	var buffer bytes.Buffer
	enc = gob.NewEncoder(&buffer)
	var cstr cquad.String = "quad"
	gob.Register(cstr)

	it := v.QS.QuadsAllIterator()
	for it.Next(ctx) {
		ref := it.Result()
		q := v.QS.Quad(ref)
		err := enc.Encode(q)
		if err != nil {
			return err
		}
	}

	tx, err = v.AssetDatabase.Begin(true)
	if err != nil {
		return err
	}
	defer tx.Rollback()

	err = tx.Bucket([]byte("Graph")).Put([]byte("Graph"), []byte(buffer.Bytes()))
	if err = tx.Commit(); err != nil {
		return err
	}
	if err = v.AssetDatabase.Close(); err != nil {
		return err
	}

	return nil
}

func (v *GcpViz) EscapeLabel(label string) string {
	if strings.HasPrefix(strings.Trim(label, " \n"), "<") && strings.HasSuffix(strings.Trim(label, " \n"), ">") {
		return fmt.Sprintf("%s", strings.ReplaceAll(label, "\n", "<br/>"))
	}
	return fmt.Sprintf("%s", strconv.Quote(label))
}

func (v *GcpViz) getAsset(node string) (*TemplateResource, error) {

	if strings.HasPrefix(node, "https://www.googleapis.com/compute/v1/") {
		node = strings.Replace(node, "https://www.googleapis.com/compute/v1/", "//compute.googleapis.com/", 1)
	}

	tx, err := v.AssetDatabase.Begin(false)
	if err != nil {
		return nil, err
	}
	defer tx.Rollback()
	v.Assets = tx.Bucket([]byte("Assets"))
	if v.Assets == nil {
		return nil, errors.New("could not find bucket Assets in database")
	}

	resource := v.Assets.Get([]byte(node))
	if resource == nil {
		return nil, fmt.Errorf("resource %s not found in database", node)
	}

	var templateResource TemplateResource
	err = json.Unmarshal(resource, &templateResource)
	if err != nil {
		return nil, errors.Wrap(err, "marshaling resource to template resource")
	}
	return &templateResource, nil
}

func (v *GcpViz) renderNode(out io.Writer, node string, id int64) (bool, error) {
	templateResource, err := v.getAsset(node)
	if err != nil {
		return false, errors.Wrapf(err, fmt.Sprintf("resource %s not found", node))
	}

	if _, found := Labels[templateResource.AssetType]; !found {
		return false, fmt.Errorf("label template not found for resource type %s", templateResource.AssetType)
	}
	if Labels[templateResource.AssetType] != nil {
		var label bytes.Buffer
		Labels[templateResource.AssetType].Execute(&label, templateResource)

		var link string = ""
		if _, found := Links[templateResource.AssetType]; found {
			var linkBuf bytes.Buffer
			Links[templateResource.AssetType].Execute(&linkBuf, templateResource)
			link = linkBuf.String()
		}

		if _, found := Nodes[templateResource.AssetType]; !found {
			return false, fmt.Errorf("node style template not found for resource type %s", templateResource.AssetType)
		}

		var nodeOut bytes.Buffer
		nodeStyle := NodeStyle{Resource: &templateResource.Resource, Label: v.EscapeLabel(strings.Trim(label.String(), "\n")), Link: v.EscapeLabel(strings.Trim(link, "\n"))}
		err = Nodes[templateResource.AssetType].Execute(&nodeOut, nodeStyle)
		if err != nil {
			return false, errors.Wrapf(err, fmt.Sprintf("error rending resource %s node", node))
		}

		if strings.TrimSpace(nodeOut.String()) != "" {
			fmt.Fprintf(out, "  N_%d [%s];\n", id, strings.Trim(nodeOut.String(), "\n"))
			return true, nil
		}
	}
	return false, nil
}

func (v *GcpViz) renderBothNodes(parent string, node string, parentId int64, id int64, out io.Writer) error {
	if parentId != -1 {
		pRaw := make([]byte, 8)
		binary.BigEndian.PutUint64(pRaw, uint64(parentId))
		if !v.bfilter.Test(pRaw) {
			rendered, err := v.renderNode(out, parent, parentId)
			if err == nil {
				if rendered {
					v.bfilter.Add(pRaw)
				}
			} else {
				fmt.Fprintf(os.Stderr, "Failed to render parent node %s: %v\n", parent, err)
			}
		}
	}

	nRaw := make([]byte, 8)
	binary.BigEndian.PutUint64(nRaw, uint64(id))
	if !v.bfilter.Test(nRaw) {
		rendered, err := v.renderNode(out, node, id)
		if err == nil {
			if rendered {
				v.bfilter.Add(nRaw)
			}
		} else {
			fmt.Fprintf(os.Stderr, "Failed to render node %s: %v\n", node, err)
		}
	}
	return nil
}

func (v *GcpViz) renderEdge(parent string, node string, parentId int64, id int64, out io.Writer) error {
	templateResourceParent, err := v.getAsset(parent)
	if err != nil {
		return errors.Wrapf(err, fmt.Sprintf("parent resource %s not found", parent))
	}
	templateResourceTarget, err := v.getAsset(node)
	if err != nil {
		return errors.Wrapf(err, fmt.Sprintf("target resource %s not found", node))
	}

	var edgeStyle *template.Template = nil
	if parentStyle, found := Edges[templateResourceParent.AssetType]; found {
		if targetStyle, found := parentStyle[templateResourceTarget.AssetType]; found {
			edgeStyle = targetStyle
		} else {
			fmt.Fprintf(os.Stderr, "Missing style %s -> %s (from %s TO %s)\n", templateResourceParent.AssetType, templateResourceTarget.AssetType, parent, node)
		}
	} else {
		fmt.Fprintf(os.Stderr, "Missing style %s -> %s (FROM %s to %s)\n", templateResourceParent.AssetType, templateResourceTarget.AssetType, parent, node)
	}

	if edgeStyle != nil {
		var headLabel bytes.Buffer
		if _, found := HeadLabels[templateResourceParent.AssetType]; found {
			HeadLabels[templateResourceParent.AssetType].Execute(&headLabel, templateResourceParent)
		}
		var tailLabel bytes.Buffer
		if _, found := TailLabels[templateResourceParent.AssetType]; found {
			TailLabels[templateResourceParent.AssetType].Execute(&tailLabel, templateResourceParent)
		}

		var edgeOut bytes.Buffer
		nodeStyle := NodeStyle{TailLabel: v.EscapeLabel(strings.Trim(tailLabel.String(), "\n")), HeadLabel: v.EscapeLabel(strings.Trim(headLabel.String(), "\n"))}
		edgeStyle.Execute(&edgeOut, nodeStyle)

		edge := strings.Trim(edgeOut.String(), "\n")
		if edge != "" {
			fmt.Fprintf(out, "  N_%d -> N_%d [%s];\n", parentId, id, edge)
		} else {
			fmt.Fprintf(out, "  N_%d -> N_%d;\n", parentId, id)
		}
	}
	return nil
}

func (v *GcpViz) GenerateNodes(wg *sync.WaitGroup, ctx context.Context, gizmoQuery string, parameters map[string]interface{}, out io.Writer) error {
	defer wg.Done()

	stats, err := v.QS.Stats(ctx, true)
	if err != nil {
		return err
	}
	v.bfilter = bloom.New(uint(20*stats.Quads.Size), 5)

	fmt.Fprintf(out, "digraph GCP {\n")
	for k, v := range Style.Global {
		var style bytes.Buffer
		styleTemplate, err := template.New("style").Parse(v)
		if err != nil {
			return fmt.Errorf("error parsing style template: %v", err)
		}
		styleTemplate.Execute(&style, parameters)

		fmt.Fprintf(out, "  %s [%s];\n", k, style.String())
	}
	for k, v := range Style.Options {
		fmt.Fprintf(out, "  %s=%s;\n", k, v)
	}

	queryTemplate, err := template.New("query").Parse(gizmoQuery)
	if err != nil {
		return fmt.Errorf("error parsing query template: %v", err)
	}
	var gizmoQ bytes.Buffer
	parameters["Organizations"] = v.OrgRoots
	queryTemplate.Execute(&gizmoQ, parameters)

	session := gizmo.NewSession(v.QS)
	it, err := session.Execute(ctx, gizmoQ.String(), query.Options{
		Collation: query.Raw,
		Limit:     -1,
	})
	if err != nil {
		return err
	}
	defer it.Close()
	for it.Next(ctx) {
		result := it.Result()
		switch result.(type) {
		case (*gizmo.Result):
		case string:
			log.Fatalf("Invalid result from query, expected nodes, got string: %v", result.(string))
		default:
			log.Fatalf("Invalid result from query, expected nodes, got: %v", result)
		}
		data := result.(*gizmo.Result)

		var (
			node string
			id   int64
			val  map[string]interface{}
		)
		if _, found := data.Tags[gizmo.TopResultTag]; !found {
			val = data.Val.(map[string]interface{})
			if _, found = val[gizmo.TopResultTag]; !found {
				continue
			} else {
				node = val[gizmo.TopResultTag].(string)
				qval, err := cquad.AsValue(node)
				if !err {
					continue
				}
				id = reflect.ValueOf(v.QS.ValueOf(qval).Key()).Int()
			}
		} else {
			node = v.QS.NameOf(data.Tags[gizmo.TopResultTag]).Native().(string)
			id = reflect.ValueOf(data.Tags[gizmo.TopResultTag]).Int()
		}

		var parent string = ""
		var parentId int64 = -1

		if _, found := data.Tags["parent"]; !found {
			if _, found := val["parent"]; found {
				parent = val["parent"].(string)
				qval, err := cquad.AsValue(parent)
				if !err {
					continue
				}
				parentId = reflect.ValueOf(v.QS.ValueOf(qval).Key()).Int()
			} else {
				if !strings.HasPrefix(node, "//cloudresourcemanager.googleapis.com/") {
					keys := make([]string, 0, len(data.Tags))
					for key := range data.Tags {
						keys = append(keys, key)
					}
					return errors.New(fmt.Sprintf("Node %s missing parent tag (tags: %s)", node, strings.Join(keys, ",")))
				}
			}
		} else {
			parent = v.QS.NameOf(data.Tags["parent"]).Native().(string)
			parentId = reflect.ValueOf(data.Tags["parent"]).Int()
		}

		err := v.renderBothNodes(parent, node, parentId, id, out)
		if err != nil {
			fmt.Fprintf(os.Stderr, "Error rendering node (%s -> %s): %v\n", parent, node, err)
		}
	}
	if err := it.Err(); err != nil {
		return err
	}

	// Second pass, render edges
	session = gizmo.NewSession(v.QS)
	it, err = session.Execute(ctx, gizmoQ.String(), query.Options{
		Collation: query.Raw,
		Limit:     -1,
	})
	if err != nil {
		return err
	}
	defer it.Close()
	for it.Next(ctx) {
		data := it.Result().(*gizmo.Result)
		var (
			node string
			id   int64
			val  map[string]interface{}
		)
		if _, found := data.Tags[gizmo.TopResultTag]; !found {
			val = data.Val.(map[string]interface{})
			if _, found = val[gizmo.TopResultTag]; !found {
				continue
			} else {
				node = val[gizmo.TopResultTag].(string)
				qval, err := cquad.AsValue(node)
				if !err {
					continue
				}
				id = reflect.ValueOf(v.QS.ValueOf(qval).Key()).Int()
			}
		} else {
			node = v.QS.NameOf(data.Tags[gizmo.TopResultTag]).Native().(string)
			id = reflect.ValueOf(data.Tags[gizmo.TopResultTag]).Int()
		}

		qval, err := cquad.AsValue(node)
		if !err {
			continue
		}
		p := cayley.StartPath(v.QS, qval).In("uses")
		var hadEdge bool = false
		p.Iterate(nil).EachValue(v.QS, func(val cquad.Value) {
			targetId := reflect.ValueOf(v.QS.ValueOf(val).Key()).Int()

			tRaw := make([]byte, 8)
			binary.BigEndian.PutUint64(tRaw, uint64(targetId))

			sRaw := make([]byte, 8)
			binary.BigEndian.PutUint64(sRaw, uint64(id))

			if v.bfilter.Test(sRaw) && v.bfilter.Test(tRaw) {
				target := cquad.NativeOf(val).(string)
				err := v.renderEdge(target, node, targetId, id, out) // Ignore errors, because some resources might be missing
				if err == nil {
					hadEdge = true
				}
			}
		})
		if !hadEdge { // Disconnected item
			// We may want to do something here in the future, likely forcible connect to parent to avoid floating
			// resources.
		}
	}
	if err := it.Err(); err != nil {
		return err
	}

	fmt.Fprintf(out, "}\n")
	return nil
}

func (v *GcpViz) ExportNodes(wg *sync.WaitGroup, ctx context.Context, out io.Writer) error {
	defer wg.Done()

	tx, err := v.AssetDatabase.Begin(false)
	if err != nil {
		return err
	}
	defer tx.Rollback()

	// Iterate assets in BoltDB
	b := tx.Bucket([]byte("Assets"))
	c := b.Cursor()

	fmt.Fprintf(os.Stderr, "Reading assets...")

	var assets map[string]interface{}
	assets = make(map[string]interface{}, 0)
	for k, v := c.First(); k != nil; k, v = c.Next() {
		var asset map[string]interface{}
		err = json.Unmarshal(v, &asset)
		if err != nil {
			return err
		}
		assetMap := make(map[string]interface{}, 0)
		assetMap["id"] = string(k)
		assetMap["asset"] = asset
		assets[string(k)] = assetMap
	}
	fmt.Fprintf(os.Stderr, "done.\n")

	fmt.Fprintf(os.Stderr, "Reading edges...")

	// Iterate graph in BoltDB
	gb := tx.Bucket([]byte("Graph"))
	gc := gb.Cursor()
	for k, v := gc.First(); k != nil; k, v = gc.Next() {
		var q cquad.Quad

		dec := gob.NewDecoder(bytes.NewReader(v))
		for true {
			err = dec.Decode(&q)
			if err != nil {
				break
			}
			subject := q.Subject.String()
			if len(subject) > 2 {
				subject = subject[1 : len(subject)-1]
				if _, ok := assets[subject]; ok {
					var asset map[string]interface{}
					asset = assets[subject].(map[string]interface{})
					if _, ok := asset["edges"]; !ok {
						asset["edges"] = make(map[string]interface{}, 0)
					}

					var edgeMap map[string]interface{} = asset["edges"].(map[string]interface{})
					predicate := q.Predicate.String()
					predicate = predicate[1 : len(predicate)-1]
					if predicate != "data" {
						if _, ok := edgeMap[predicate]; !ok {
							edgeMap[predicate] = make([]string, 0)
						}

						var predList []string
						predList = edgeMap[predicate].([]string)

						object := q.Object.String()
						object = object[1 : len(object)-1]
						predList = append(predList, object)

						edgeMap[predicate] = predList
					}
				}
			}
		}
	}
	fmt.Fprintf(os.Stderr, " done.\n")

	fmt.Fprintf(os.Stderr, "Exporting...")
	for _, v := range assets {
		assetBlob, err := json.Marshal(v)
		if err != nil {
			return err
		}
		out.Write(assetBlob)
		out.Write([]byte("\n"))
	}
	fmt.Fprintf(os.Stderr, " done.\n")

	return nil
}

// Private methods
func (v *GcpViz) loadRelationsMap(fileName string) error {
	yamlFile, err := ioutil.ReadFile(fileName)
	if err != nil {
		return err
	}
	var relations RawResourceRelations
	err = yaml.Unmarshal(yamlFile, &relations)
	if err != nil {
		return err
	}

	v.Relations.AssetTypes = make(map[string][]jsonpath.FilterFunc, len(relations.AssetTypes))
	for assetType, paths := range relations.AssetTypes {
		v.Relations.AssetTypes[assetType] = make([]jsonpath.FilterFunc, len(paths))
		for idx, path := range paths {
			preparedPath, err := jsonpath.Prepare(path)
			if err != nil {
				return err
			}
			v.Relations.AssetTypes[assetType][idx] = preparedPath
		}
	}

	v.Relations.Aliases = make(map[string][]jsonpath.FilterFunc, len(relations.Aliases))
	for assetType, paths := range relations.Aliases {
		v.Relations.Aliases[assetType] = make([]jsonpath.FilterFunc, len(paths))
		for idx, path := range paths {
			preparedPath, err := jsonpath.Prepare(path)
			if err != nil {
				return err
			}
			v.Relations.Aliases[assetType][idx] = preparedPath
		}
	}

	v.Relations.IpAddresses = make(map[string][]jsonpath.FilterFunc, len(relations.IpAddresses))
	for assetType, paths := range relations.IpAddresses {
		v.Relations.IpAddresses[assetType] = make([]jsonpath.FilterFunc, len(paths))
		for idx, path := range paths {
			preparedPath, err := jsonpath.Prepare(path)
			if err != nil {
				return err
			}
			v.Relations.IpAddresses[assetType][idx] = preparedPath
		}
	}

	v.Relations.Enrich = make(map[string]map[string]map[string]jsonpath.FilterFunc, len(relations.Enrich))
	for assetType, fields := range relations.Enrich {
		v.Relations.Enrich[assetType] = make(map[string]map[string]jsonpath.FilterFunc, len(fields))
		for fieldName, subAsset := range fields {
			v.Relations.Enrich[assetType][fieldName] = make(map[string]jsonpath.FilterFunc, len(subAsset))
			for subAssetType, path := range subAsset {
				preparedPath, err := jsonpath.Prepare(path)
				if err != nil {
					return err
				}
				v.Relations.Enrich[assetType][fieldName][subAssetType] = preparedPath
			}
		}
	}

	return nil
}

func (v *GcpViz) loadLabelsMap(fileName string) error {
	yamlFile, err := ioutil.ReadFile(fileName)
	if err != nil {
		return err
	}
	var tempLabels map[string]map[string]string
	err = yaml.Unmarshal(yamlFile, &tempLabels)
	if err != nil {
		return err
	}

	Labels = make(map[string]*template.Template, len(tempLabels))
	HeadLabels = make(map[string]*template.Template, len(tempLabels))
	TailLabels = make(map[string]*template.Template, len(tempLabels))
	Links = make(map[string]*template.Template, len(tempLabels))
	for k, v := range tempLabels {
		if labelTemplate, ok := v["label"]; ok {
			if labelTemplate != "" {
				s, err := template.New(k).Funcs(templateFuncMap).Parse(labelTemplate)
				if err != nil {
					return errors.Wrap(err, fmt.Sprintf("error parsing label template for resource type %s", k))
				}
				Labels[k] = s
			} else {
				Labels[k] = nil
			}
		}
		if headLabelTemplate, ok := v["headLabel"]; ok {
			s, err := template.New(k).Funcs(templateFuncMap).Parse(headLabelTemplate)
			if err != nil {
				return errors.Wrap(err, fmt.Sprintf("error parsing head label template for resource type %s", k))
			}
			HeadLabels[k] = s
		}
		if tailLabelTemplate, ok := v["tailLabel"]; ok {
			s, err := template.New(k).Funcs(templateFuncMap).Parse(tailLabelTemplate)
			if err != nil {
				return errors.Wrap(err, fmt.Sprintf("error parsing head label template for resource type %s", k))
			}
			TailLabels[k] = s
		}
		if linkTemplate, ok := v["link"]; ok {
			s, err := template.New(k).Funcs(templateFuncMap).Parse(linkTemplate)
			if err != nil {
				return errors.Wrap(err, fmt.Sprintf("error parsing link template for resource type %s", k))
			}
			Links[k] = s
		}
	}

	return nil
}

func (v *GcpViz) loadStyleMap(fileName string, override map[string]string) error {
	yamlFile, err := ioutil.ReadFile(fileName)
	if err != nil {
		return err
	}
	err = yaml.Unmarshal(yamlFile, &Style)
	if err != nil {
		return err
	}

	if override != nil && len(override) > 0 {
		jsn, err := json.Marshal(Style)
		if err != nil {
			return errors.Wrap(err, "marshaling to json")
		}

		var jsnStr = string(jsn)
		for path, newValue := range override {
			jsnStr, err = sjson.Set(jsnStr, path, newValue)
			if err != nil {
				return err
			}
		}

		var temp map[string]interface{}
		err = json.Unmarshal([]byte(jsnStr), &temp)
		if err != nil {
			return errors.Wrap(err, "marshaling to interface")
		}

		updatedYaml, err := yaml.Marshal(temp)
		if err != nil {
			return err
		}

		err = yaml.Unmarshal(updatedYaml, &Style)
		if err != nil {
			return err
		}
	}

	Nodes = make(map[string]*template.Template, len(Style.Nodes))
	for k, v := range Style.Nodes {
		s, err := template.New(k).Funcs(templateFuncMap).Parse(v)
		if err != nil {
			return errors.Wrap(err, fmt.Sprintf("error parsing node style for resource type %s", k))
		}
		Nodes[k] = s
	}

	Edges = make(map[string]map[string]*template.Template, len(Style.Edges))
	for k, v := range Style.Edges {
		Edges[k] = make(map[string]*template.Template, len(v))
		for kk, vv := range v {
			s, err := template.New(k).Funcs(templateFuncMap).Parse(vv)
			if err != nil {
				return errors.Wrap(err, fmt.Sprintf("error parsing edge style for resource type %s", k))
			}
			Edges[k][kk] = s
		}
	}

	return nil
}

func (v *GcpViz) initializeBolt() error {
	tx, err := v.AssetDatabase.Begin(true)
	if err != nil {
		return err
	}
	defer tx.Rollback()

	_, err = tx.CreateBucket([]byte("Assets"))
	if err != nil {
		return err
	}

	_, err = tx.CreateBucket([]byte("Graph"))
	if err != nil {
		return err
	}

	_, err = tx.CreateBucket([]byte("Aliases"))
	if err != nil {
		return err
	}

	_, err = tx.CreateBucket([]byte("Organizations"))
	if err != nil {
		return err
	}

	if err := tx.Commit(); err != nil {
		return err
	}
	return nil
}

func (v *GcpViz) jsonPathResultsToString(results interface{}) ([]string, error) {
	switch results.(type) {
	case string:
		return []string{results.(string)}, nil
	case []interface{}:
		var temp []string
		for _, val := range results.([]interface{}) {
			ret, err := v.jsonPathResultsToString(val)
			if err != nil {
				return nil, err
			}
			for _, s := range ret {
				temp = append(temp, s)
			}
		}
		return temp, nil
	}
	return nil, errors.New("unable to process JSON path results")
}

/* Programmatic cross asset resolver:
 * Some references cannot be handled with simple references since their targets do not match the
 * name attribute of a resource. This method walks through the builds translations tables.
 *
 * Example: firewall rule target service accounts are in email format and iam.googleapis.com/ServiceAccount
 * IDs are in in projects/proj-id/serviceAccounts/service-account-id format.
 */

func (v *GcpViz) EnrichAssets() error {
	// Iterate BoltDB
	tx, err := v.AssetDatabase.Begin(false)
	if err != nil {
		return err
	}
	defer tx.Rollback()

	/* Step 1: alias generation, configured via relations file */
	aliasAssetTypes := make([]string, 0, len(v.Relations.Aliases))
	for ak, _ := range v.Relations.Aliases {
		aliasAssetTypes = append(aliasAssetTypes, ak)
	}

	fmt.Fprintf(os.Stderr, "\nCreating reference aliases for assets...\n")
	wrtx, err := v.AssetDatabase.Begin(true)
	if err != nil {
		return err
	}
	err = tx.Bucket([]byte("Assets")).ForEach(func(bk, bv []byte) error {
		isAliasAsset := false
		for _, aliasAssetType := range aliasAssetTypes {
			// Simple optimization to avoid unmarshaling tons of JSON
			if strings.Contains(string(bv), aliasAssetType) {
				isAliasAsset = true
				break
			}
		}
		if !isAliasAsset {
			return nil
		}

		asset, resource, err := v.parseJsonAsset(bv)
		if err != nil {
			return err
		}

		name := asset.GetName()
		assetType := asset.GetAssetType()
		_resource := resource.(map[string]interface{})
		if aliases, ok := v.Relations.Aliases[assetType]; ok {
			for _, jsonPath := range aliases {
				if res, ok := _resource["resource"]; ok {
					_data := res.(map[string]interface{})
					if _, ok := _data["data"]; ok {
						targets, err := jsonPath(_data)
						if err != nil {
							continue
						}

						_targets, err := v.jsonPathResultsToString(targets)
						for _, vertex := range _targets {
							err = wrtx.Bucket([]byte("Aliases")).Put([]byte(vertex), []byte(name))
							v.TotalAliases++
						}
					}
				}

			}
		}
		return nil
	})
	if err != nil {
		wrtx.Rollback()
		return err
	} else {
		if err = wrtx.Commit(); err != nil {
			return err
		}
	}

	fmt.Fprintf(os.Stderr, "Creating references between assets...\n")
	tx, err = v.AssetDatabase.Begin(false)
	if err != nil {
		return err
	}
	defer tx.Rollback()

	relationsAssetTypes := make([]string, 0, len(v.Relations.AssetTypes))
	for rk, _ := range v.Relations.AssetTypes {
		relationsAssetTypes = append(relationsAssetTypes, rk)
	}

	ipAssetTypes := make([]string, 0, len(v.Relations.IpAddresses))
	for ik, _ := range v.Relations.IpAddresses {
		ipAssetTypes = append(ipAssetTypes, ik)
	}

	ipAddresses := make([]IpAddressLink, 0)

	/* Step 2: standard reference generation, configured via relations file */
	err = tx.Bucket([]byte("Assets")).ForEach(func(bk, bv []byte) error {
		isRelationsAsset := false
		isIpAsset := false
		for _, relationsAssetType := range relationsAssetTypes {
			// Simple optimization to avoid unmarshaling tons of JSON
			if strings.Contains(string(bv), relationsAssetType) {
				isRelationsAsset = true
				break
			}
		}
		for _, ipAssetType := range ipAssetTypes {
			// Simple optimization to avoid unmarshaling tons of JSON
			if strings.Contains(string(bv), ipAssetType) {
				isIpAsset = true
				break
			}
		}

		if !isRelationsAsset && !isIpAsset {
			return nil
		}

		asset, resource, err := v.parseJsonAsset(bv)
		if err != nil {
			return err
		}

		assetType := asset.GetAssetType()
		name := asset.GetName()

		if isIpAsset {
			_resource := resource.(map[string]interface{})
			if relations, ok := v.Relations.IpAddresses[assetType]; ok {
				for _, jsonPath := range relations {
					if res, ok := _resource["resource"]; ok {
						_data := res.(map[string]interface{})
						if _, ok := _data["data"]; ok {
							targets, err := jsonPath(_data)
							if err != nil {
								continue
							}
							_targets, err := v.jsonPathResultsToString(targets)
							for _, ipRange := range _targets {
								if ipRange == "0.0.0.0/0" {
									continue
								}
								if !strings.Contains(ipRange, "/") {
									ipRange = ipRange + "/32"
								}
								_, parsedIp, err := net.ParseCIDR(ipRange)
								if err != nil {
									fmt.Fprintf(os.Stderr, "Warning: Failed to parse IP %v for resource %v.\n", ipRange, name)
								}
								ip := IpAddressLink{Ip: parsedIp, Resource: name, AssetType: assetType}
								ipAddresses = append(ipAddresses, ip)
								v.TotalIps++
							}
						}
					}
				}
			}
		}

		if isRelationsAsset {
			_resource := resource.(map[string]interface{})
			if relations, ok := v.Relations.AssetTypes[assetType]; ok {
				for _, jsonPath := range relations {
					if res, ok := _resource["resource"]; ok {
						_data := res.(map[string]interface{})
						if _, ok := _data["data"]; ok {
							targets, err := jsonPath(_data)
							if err != nil {
								continue
							}
							_targets, err := v.jsonPathResultsToString(targets)
							for _, vertex := range _targets {
								if strings.HasPrefix(vertex, "https://www.googleapis.com/compute/v1/") {
									vertex = strings.Replace(vertex, "https://www.googleapis.com/compute/v1/", "//compute.googleapis.com/", 1)
								}
								if !strings.HasPrefix(vertex, "//") && strings.Contains(vertex, ".googleapis.com/") {
									vertex = fmt.Sprintf("//%s", vertex)
								}
								rotx, err := v.AssetDatabase.Begin(false)
								if err != nil {
									return err
								}
								defer rotx.Rollback()

								target := rotx.Bucket([]byte("Assets")).Get([]byte(vertex))
								if target == nil {
									alias := rotx.Bucket([]byte("Aliases")).Get([]byte(vertex))
									if alias != nil {
										vertex = string(alias)
									} else {
										if !strings.HasPrefix(vertex, "//") && !strings.Contains(vertex, ".googleapis.com/") {
											p := strings.SplitN(assetType, "/", 2)
											vertex = fmt.Sprintf("//%s/%s", p[0], vertex)
										}
									}
								}

								v.QW.AddQuad(cayley.Quad(name, "uses", vertex, assetType))
								v.TotalEdges++
							}
						}
					}
				}
			}
		}

		return nil
	})

	/* Step 3: Link via IP addresses */
	fmt.Fprintf(os.Stderr, "Processing resource IP addresses...\n")
	for ik, ip := range ipAddresses {
		for sik, sip := range ipAddresses {
			if ik != sik {
				if ip.AssetType != sip.AssetType && sip.Ip.Contains(ip.Ip.IP) {
					v.QW.AddQuad(cayley.Quad(ip.Resource, "uses", sip.Resource, ip.AssetType))
					v.TotalEdges++
				}
			}
		}
	}
	/* Step 4: Enrich existing asset types by incorporating linked assets into new fields */
	enrichAssetTypes := make([]string, 0, len(v.Relations.Enrich))
	for ek, _ := range v.Relations.Enrich {
		enrichAssetTypes = append(enrichAssetTypes, ek)
	}
	enrichedAssets := make(map[string]map[string][]interface{}, 0)

	fmt.Fprintf(os.Stderr, "Integrating subassets as part of main assets...\n")
	err = tx.Bucket([]byte("Assets")).ForEach(func(bk, bv []byte) error {
		isEnrichAsset := false
		for _, enrichAssetType := range enrichAssetTypes {
			// Simple optimization to avoid unmarshaling tons of JSON
			if strings.Contains(string(bv), enrichAssetType) {
				isEnrichAsset = true
				break
			}
		}
		if !isEnrichAsset {
			return nil
		}
		asset, _, err := v.parseJsonAsset(bv)
		if err != nil {
			return err
		}

		assetType := asset.GetAssetType()
		name := asset.GetName()
		qval, qerr := cquad.AsValue(name)
		if !qerr {
			return err
		}

		var subAssets []interface{}
		subAssets = append(subAssets, nil)
		for _, subAssetTypes := range v.Relations.Enrich[assetType] {
			for subAssetType, _ := range subAssetTypes {
				subAssets = append(subAssets, subAssetType)
			}
		}
		newFields := make(map[string][]interface{}, 0)

		p := cayley.StartPath(v.QS, qval).LabelContext(subAssets...).In("uses")
		p.Iterate(nil).EachValue(v.QS, func(val cquad.Value) {
			target := cquad.NativeOf(val).(string)
			targetAsset, err := v.getAsset(target)
			if err != nil {
				fmt.Fprintf(os.Stderr, "Warning: could not fetch sub-asset %v\n", target)
			} else {
				_data := targetAsset.Resource.Data.(map[string]interface{})
				for field, subAssetTypes := range v.Relations.Enrich[assetType] {
					for subAssetType, jsonPath := range subAssetTypes {
						if subAssetType == targetAsset.AssetType {
							targets, err := jsonPath(_data)
							if err != nil {
								fmt.Fprintf(os.Stderr, "Warning: JSON-Path error in enrichment: %v\n", err)
								continue
							}
							if _, ok := newFields[field]; !ok {
								newFields[field] = make([]interface{}, 0)
							}
							newFields[field] = append(newFields[field], targets)
						}
					}
				}
				enrichedAssets[name] = newFields
			}
		})

		return nil
	})

	tx, err = v.AssetDatabase.Begin(true)
	if err != nil {
		return err
	}
	defer tx.Rollback()

	for name, newFields := range enrichedAssets {
		asset, err := v.getAsset(name)
		if err == nil {
			for k, v := range newFields {
				asset.Resource.Data.(map[string]interface{})[k] = v
			}
			err = v.UpdateAsset(tx, name, asset)
			if err != nil {
				return err
			}
		} else {
			return err
		}
	}
	if err = tx.Commit(); err != nil {
		return err
	}

	fmt.Fprintf(os.Stderr, "\nTotal vertexes: %d, total edges: %d, total aliases: %d, total IPs: %d\n", v.TotalVertexes, v.TotalEdges, v.TotalAliases, v.TotalIps)
	return nil
}

func (v *GcpViz) AddAsset(tx *bolt.Tx, asset validator.Asset, resource interface{}, addResourceData bool) error {
	name := asset.GetName()
	parent := asset.GetResource().GetParent()
	assetType := asset.GetAssetType()

	jsn, err := json.Marshal(resource)
	if err != nil {
		return errors.Wrap(err, "marshaling to json")
	}
	err = tx.Bucket([]byte("Assets")).Put([]byte(name), []byte(jsn))
	if err != nil {
		return err
	}
	if assetType == "cloudresourcemanager.googleapis.com/Organization" {
		v.OrgRoots = append(v.OrgRoots, name)
	}

	v.QW.AddQuad(cayley.Quad(parent, "child", name, assetType))
	if addResourceData {
		data := resource.(map[string]interface{})
		if resourceValue, ok := data["resource"]; ok {
			resourceValueMap := resourceValue.(map[string]interface{})
			if _, ok := resourceValueMap["data"]; ok {
				v.QW.AddQuad(cayley.Quad(name, "data", string(jsn), assetType))
			}
		}

	}
	v.TotalVertexes++
	v.TotalEdges++
	return nil
}

func (v *GcpViz) UpdateAsset(tx *bolt.Tx, name string, resource interface{}) error {
	jsn, err := json.Marshal(resource)
	if err != nil {
		return errors.Wrap(err, "marshaling to json")
	}

	err = tx.Bucket([]byte("Assets")).Put([]byte(name), []byte(jsn))
	if err != nil {
		return err
	}
	return nil
}

func (v *GcpViz) ReadAssetsFromFile(input string, addResourceData bool) error {
	file, err := os.Open(input)
	if err != nil {
		return err
	}

	finfo, err := file.Stat()
	if err != nil {
		return nil
	}
	fileSize := finfo.Size()

	var reader = bufio.NewReader(file)
	const bufferSize = 5 * 1024 * 1024 // Length of one line is maximum 5 MB

	scanner := bufio.NewScanner(reader)
	buf := make([]byte, bufferSize)
	scanner.Buffer(buf, bufferSize)

	var (
		lastPos        int64 = 0
		printThreshold int64 = fileSize / 20
		writes         int64 = 0
	)
	// Insert resource to BoltDB
	tx, err := v.AssetDatabase.Begin(true)
	if err != nil {
		return err
	}
	defer tx.Rollback()

	for scanner.Scan() {
		if writes > 1000 {
			// Commit, start new transaction
			if err = tx.Commit(); err != nil {
				return err
			}
			tx, err = v.AssetDatabase.Begin(true)
			if err != nil {
				return err
			}
			defer tx.Rollback()
			writes = 0
		}
		currentPos, err := file.Seek(0, io.SeekCurrent)
		if err != nil {
			return err
		}
		if (currentPos - lastPos) >= printThreshold {
			fmt.Fprintf(os.Stderr, "Reading assets: %d/%d bytes processed.\r", currentPos, fileSize)
			lastPos = currentPos
		}

		pbAsset, resource, err := v.parseJsonAsset(scanner.Bytes())
		if err != nil {
			return err
		}

		err = v.AddAsset(tx, *pbAsset, resource, addResourceData)
		if err != nil {
			return err
		}
		writes++
	}
	if err = tx.Commit(); err != nil {
		return err
	}
	return nil
}

// Code graciously borrowed from CFT Scorecard
func (v *GcpViz) unmarshallAsset(from []byte, to proto.Message) (interface{}, error) {
	var temp map[string]interface{}
	err := json.Unmarshal(from, &temp)
	if err != nil {
		return nil, errors.Wrap(err, "marshaling to interface")
	}
	if val, ok := temp["org_policy"]; ok {
		for _, op := range val.([]interface{}) {
			orgPolicy := op.(map[string]interface{})
			delete(orgPolicy, "update_time")
		}
	}
	err = v.protoViaJSON(temp, to)
	if err == nil {
		return temp, nil
	}
	return nil, err
}

// protoViaJSON uses JSON as an intermediary serialization to convert a value into
// a protobuf message.
func (v *GcpViz) protoViaJSON(from interface{}, to proto.Message) error {
	jsn, err := json.Marshal(from)
	if err != nil {
		return errors.Wrap(err, "marshaling to json")
	}
	umar := &jsonpb.Unmarshaler{AllowUnknownFields: true}
	if err := umar.Unmarshal(strings.NewReader(string(jsn)), to); err != nil {
		return errors.Wrap(err, "unmarshaling to proto")
	}

	return nil
}

// Code graciously borrowed from CFT Scorecard
func (v *GcpViz) parseJsonAsset(input []byte) (*validator.Asset, interface{}, error) {
	pbAsset := &validator.Asset{}
	umj, err := v.unmarshallAsset(input, pbAsset)
	if err != nil {
		return nil, nil, errors.Wrapf(err, "converting asset %s to proto", string(input))
	}

	err = cvasset.SanitizeAncestryPath(pbAsset)
	if err != nil {
		return nil, nil, errors.Wrapf(err, "fetching ancestry path for %s", pbAsset)
	}
	return pbAsset, umj, nil
}
