package instance_mapper

/*
   Copyright 2022 Google LLC

   Licensed under the Apache License, Version 2.0 (the "License");
   you may not use this file except in compliance with the License.
   You may obtain a copy of the License at

       http://www.apache.org/licenses/LICENSE-2.0

   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License.
*/

import (
	"math"

	"github.com/google/cel-go/cel"
	"github.com/google/cel-go/checker/decls"
	"github.com/google/cel-go/common/types"
	"github.com/google/cel-go/common/types/ref"
	"github.com/google/cel-go/interpreter/functions"
	exprpb "google.golang.org/genproto/googleapis/api/expr/v1alpha1"
)

type MatcherLib struct{}

func GetEnv() (*cel.Env, error) {
	env, err := cel.NewEnv(cel.Lib(MatcherLib{}))
	return env, err
}

func (MatcherLib) CompileOptions() []cel.EnvOption {
	d := cel.Declarations(
		decls.NewVar("source", decls.NewMapType(decls.String, decls.Dyn)),
		decls.NewVar("target", decls.NewMapType(decls.String, decls.Dyn)),
		decls.NewVar("gpu_map", decls.NewMapType(decls.String, decls.String)),
		decls.NewFunction("difference",
			decls.NewInstanceOverload("any_difference_any",
				[]*exprpb.Type{decls.Any, decls.Any},
				decls.Double),
		),
		decls.NewFunction("percentage",
			decls.NewInstanceOverload("any_percentage_any",
				[]*exprpb.Type{decls.Any, decls.Any},
				decls.Double),
		),
		decls.NewFunction("within_percentage",
			decls.NewInstanceOverload("any_within_percentage_any",
				[]*exprpb.Type{decls.Any, decls.Any, decls.Any},
				decls.Bool),
		),
	)

	return []cel.EnvOption{
		d,
	}
}

func (MatcherLib) ProgramOptions() []cel.ProgramOption {
	return []cel.ProgramOption{
		cel.Functions(
			&functions.Overload{
				Operator: "any_difference_any",
				Binary: func(lhs ref.Val, rhs ref.Val) ref.Val {
					var lh, rh types.Double
					lh = lhs.ConvertToType(types.DoubleType).(types.Double)
					rh = rhs.ConvertToType(types.DoubleType).(types.Double)
					return types.Double(math.Abs(float64(lh - rh)))
				},
			},
			&functions.Overload{
				Operator: "any_percentage_any",
				Binary: func(lhs ref.Val, rhs ref.Val) ref.Val {
					var lh, rh types.Double
					lh = lhs.ConvertToType(types.DoubleType).(types.Double)
					rh = rhs.ConvertToType(types.DoubleType).(types.Double)
					return types.Double(lh * (rh / 100.0))
				},
			},
			&functions.Overload{
				Operator: "any_within_percentage_any",
				Function: func(args ...ref.Val) ref.Val {
					if len(args) != 3 {
						return types.NoSuchOverloadErr()
					}
					lh, ok := args[0].ConvertToType(types.DoubleType).(types.Double)
					if !ok {
						return types.MaybeNoSuchOverloadErr(args[0])
					}
					rh, ok := args[1].ConvertToType(types.DoubleType).(types.Double)
					if !ok {
						return types.MaybeNoSuchOverloadErr(args[1])
					}
					pct, ok := args[2].ConvertToType(types.DoubleType).(types.Double)
					if !ok {
						return types.MaybeNoSuchOverloadErr(args[2])
					}
					diff := types.Double(math.Abs(float64(lh - rh)))
					if lh*(pct/100.0) >= diff {
						return types.Bool(true)
					} else {
						return types.Bool(false)
					}
				},
			},
		),
	}
}
