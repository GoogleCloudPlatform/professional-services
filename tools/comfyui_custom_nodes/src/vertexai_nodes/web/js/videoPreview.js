// Copyright 2025 Google LLC

// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at

//    http://www.apache.org/licenses/LICENSE-2.0

// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.


import { app } from "../../../scripts/app.js";
import { api } from '../../../scripts/api.js'

function fitHeight(node) {
    node.setSize([node.size[0], node.computeSize([node.size[0], node.size[1]])[1]])
    node?.graph?.setDirtyCanvas(true);
}
function chainCallback(object, property, callback) {
    if (object == undefined) {
        //This should not happen.
        console.error("Tried to add callback to non-existant object")
        return;
    }
    if (property in object) {
        const callback_orig = object[property]
        object[property] = function () {
            const r = callback_orig.apply(this, arguments);
            callback.apply(this, arguments);
            return r
        };
    } else {
        object[property] = callback;
    }
}

function addPreviewOptions(nodeType) {
    chainCallback(nodeType.prototype, "getExtraMenuOptions", function(_, options) {
        // The intended way of appending options is returning a list of extra options,
        // but this isn't used in widgetInputs.js and would require
        // less generalization of chainCallback
        let optNew = []
        try {
            const previewWidget = this.widgets.find((w) => w.name === "videopreview");

            let url = null
            if (previewWidget.videoEl?.hidden == false && previewWidget.videoEl.src) {
                //Use full quality video
                //url = api.apiURL('/view?' + new URLSearchParams(previewWidget.value.params));
                url = previewWidget.videoEl.src
            }
            if (url) {
                console.log("[VideoPreviewNode UI] Source Url : ", url)
                optNew.push(
                    {
                        content: "Open preview",
                        callback: () => {
                            window.open(url, "_blank")
                        },
                    },
                    {
                        content: "Save preview",
                        callback: () => {
                            const a = document.createElement("a");
                            a.href = url;
                            a.setAttribute("download", new URLSearchParams(previewWidget.value.params).get("filename"));
                            document.body.append(a);
                            a.click();
                            requestAnimationFrame(() => a.remove());
                        },
                    }
                );
            }
            if(options.length > 0 && options[0] != null && optNew.length > 0) {
                optNew.push(null);
            }
            options.unshift(...optNew);
            
        } catch (error) {
            console.log(error);
        }
        
    });
}
function previewVideo(node, files, type){
    var element = document.createElement("div");
    const previewNode = node;

    var widgets = node.widgets
    for (const widget of widgets) {
        if (widget.name === "videopreview") {
            node.widgets.pop(); // Remove the old widget
        }
    }

    var previewWidget = node.addDOMWidget("videopreview", "preview", element, {
        serialize: false,
        hideOnZoom: false,
        getValue() {
            return element.value;
        },
        setValue(v) {
            element.value = v;
        },
    });
    
    previewWidget.computeSize = function(width) {
        // This calculation might need adjustment for multiple videos
        // For now, it will compute based on the first video or the last one loaded.
        // You might want a fixed height, or dynamic height based on all videos.
        let totalHeight = 0;
        if (this.videoEls && this.videoEls.length > 0) {
            this.videoEls.forEach(videoEl => {
                if (videoEl.videoWidth && videoEl.videoHeight) {
                     totalHeight += (previewNode.size[0] - 20) / (videoEl.videoWidth / videoEl.videoHeight) + 10;
                }
            });
            return [width, totalHeight + 10]; // Add some padding
        }
        return [width, -4]; // No loaded src, widget should not display
    };
    // element.style['pointer-events'] = "none"
    previewWidget.value = {hidden: false, paused: false, params: {}}
    previewWidget.parentEl = document.createElement("div");
    previewWidget.parentEl.className = "video_preview";
    previewWidget.parentEl.style['width'] = "100%"
    previewWidget.parentEl.style['display'] = "flex"; // Use flexbox for layout
    previewWidget.parentEl.style['flex-direction'] = "column"; // Stack videos vertically
    previewWidget.parentEl.style['gap'] = "10px"; // Add space between videos
    element.appendChild(previewWidget.parentEl);

    previewWidget.videoEls = []; // Store multiple video elements

    files.forEach((file, index) => {
        previewWidget.videoEl = document.createElement("video");
        previewWidget.videoEl.controls = true;
        previewWidget.videoEl.loop = false;
        previewWidget.videoEl.muted = false;
        previewWidget.videoEl.style['width'] = "100%"
        previewWidget.videoEl.addEventListener("loadedmetadata", () => {

            previewWidget.aspectRatio = previewWidget.videoEl.videoWidth / previewWidget.videoEl.videoHeight;
            fitHeight(this);
        });
        previewWidget.videoEl.addEventListener("error", () => {
            //TODO: consider a way to properly notify the user why a preview isn't shown.
            previewWidget.parentEl.hidden = false;
            fitHeight(this);
        });

        let params =  {
            "filename": file,
            "type": "temp",
        }
        
        previewWidget.parentEl.hidden = previewWidget.value.hidden;
        previewWidget.videoEl.autoplay = !previewWidget.value.paused && !previewWidget.value.hidden;
        let target_width = 256
        if (element.style?.width) {
            //overscale to allow scrolling. Endpoint won't return higher than native
            target_width = element.style.width.slice(0,-2)*2;
        }
        if (!params.force_size || params.force_size.includes("?") || params.force_size == "Disabled") {
            params.force_size = target_width+"x?"
        } else {
            let size = params.force_size.split("x")
            let ar = parseInt(size[0])/parseInt(size[1])
            params.force_size = target_width+"x"+(target_width/ar)
        }
    
        // previewWidget.videoEl.src = file_path;
        previewWidget.videoEl.src = api.apiURL('/view?' + new URLSearchParams(params));
    
        previewWidget.videoEl.hidden = false;
    
        previewWidget.parentEl.appendChild(previewWidget.videoEl);
        previewWidget.videoEls.push(previewWidget.videoEl)
    });
}

app.registerExtension({
	name: "VideoPreviewNode",
	async beforeRegisterNodeDef(nodeType, nodeData, app) {
		if (nodeData?.name == "VideoPreviewNode") {
			nodeType.prototype.onExecuted = function (data) {
                
                const files = data.videos.map(item => item[0])
                const types = data.videos.map(item => item[1])

                previewVideo(this, files, types);
			}
            addPreviewOptions(nodeType)
		}
	}
});