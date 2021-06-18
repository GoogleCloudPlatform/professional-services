/*
Copyright 2020 Google LLC

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

package util

import (
	"bufio"
	"bytes"
	"errors"
	"fmt"
	"io"
	"io/ioutil"
	"log"
	"os"
	"path/filepath"

	"strings"
)

// CheckDirMode is an enumeration for selective execution
// depending on the existence of a directory
type CheckDirMode int

const (
	// CheckDirAndQuit will quit program if directory does not exist
	CheckDirAndQuit CheckDirMode = iota
	// CheckDirAndCreate will a create a new directory if it doesn't exist
	CheckDirAndCreate
	// CheckDirAndReturn will return control to the calling method after check
	CheckDirAndReturn
)

// CreateDirectory creates a new directory
func CreateDirectory(dirName string) bool {
	src, err := os.Stat(dirName)
	if os.IsNotExist(err) {
		err := os.MkdirAll(dirName, 0755)
		CheckError(err, "createDirectory().MkdirAll failed!")
		return true
	}
	if src.Mode().IsRegular() {
		fmt.Println(dirName, "already exist as a file!")
		return false
	}
	return false
}

// FileExists checks if a file exists
func FileExists(filename string) bool {
	info, err := os.Stat(filename)
	if os.IsNotExist(err) {
		return false
	}
	return !info.IsDir()
}

// CheckDir checks if a directory exists
func CheckDir(dirname string, mode CheckDirMode) bool {
	info, err := os.Stat(dirname)
	switch mode {
	case CheckDirAndQuit:
		CheckError(err, fmt.Sprintf("%s: Directory does not exist\n", dirname))
	case CheckDirAndCreate:
		if err != nil {
			if !CreateDirectory(dirname) {
				msg := fmt.Sprintf("%s: Unable to create directory!", dirname)
				CheckError(errors.New(msg), msg)
			}
		}
		return true
	default:
		if err != nil || info == nil {
			return false
		}
	}
	return true
}

// FindFile searches for files matching a pattern
func FindFile(searchDir string, pattern []string) ([]string, error) {
	fileList := make([]string, 0)
	matchList := make([]string, 0)
	err := filepath.Walk(searchDir, func(path string, f os.FileInfo, err error) error {
		fileList = append(fileList, path)
		return err
	})

	CheckError(err, "findFile().Walk() failed!")

	for _, file := range fileList {
		for _, fname := range pattern {
			if strings.HasSuffix(file, fname) {
				matchList = append(matchList, file)
			}
		}
	}
	return matchList, nil
}

// ReadFileToStringArray reads a text file into a string array
func ReadFileToStringArray(filename string) ([]string, error) {
	if len(filename) == 0 {
		return nil, nil
	}
	file, err := os.Open(filename)
	if err != nil {
		return nil, err
	}
	defer file.Close()

	result := make([]string, 0)
	reader := bufio.NewReader(file)
	for {
		line, err := reader.ReadString('\n')
		result = append(result, line)
		if err == io.EOF {
			break
		}
		if err != nil {
			return nil, err
		}
	}
	return result, nil
}

// ReadFileToByteArray reads a text file into a byte array
func ReadFileToByteArray(filename string) ([]byte, error) {
	dat, err := ioutil.ReadFile(filename)
	CheckError(err, fmt.Sprintf("%s: ReadFileToByteArray() failed.", filename))
	return dat, err
}

// FilesAreEqual compares the contents of 2 text files
func FilesAreEqual(file1, file2 string, file2Bytes []byte) bool {
	var file1Bytes []byte
	file1Bytes, _ = ReadFileToByteArray(file1)
	if len(file2Bytes) == 0 {
		file2Bytes, _ = ReadFileToByteArray(file2)
	}
	result := bytes.Equal(file1Bytes, file2Bytes)
	return result
}

// CheckFile checks if a file exists
func CheckFile(filename string) {
	if !FileExists(filename) {
		log.Printf("%s: File does not exist.\n", filename)
		os.Exit(2)
	}
}

// WriteToFile writes a string to file
func WriteToFile(s, filename string) {
	bytes := []byte(s)
	err := ioutil.WriteFile(filename, bytes, 0644)
	CheckError(err, fmt.Sprintf("%s: writeToFile() failed!", filename))
}

// WriteByteArrayToFile writes a byte array to file
func WriteByteArrayToFile(fname string, b []byte) {
	log.Printf("Trotter.WriteByteArrayToFile() executing")
	f, err := os.Create(fname)
	CheckError(err, "WriteByteArrayToFile failed: ")
	nbytes, err := f.WriteString(string(b))
	fnameAbs, err := filepath.Abs(fname)
	CheckError(err, "WriteByteArrayToFile().Abs() failed!")
	log.Printf("wrote %d bytes to: %s", nbytes, fnameAbs)
	f.Close()
	log.Printf("Trotter.WriteByteArrayToFile() completed")
}
