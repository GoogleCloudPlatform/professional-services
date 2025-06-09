# Copyright 2025 Google LLC

# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at

#    http://www.apache.org/licenses/LICENSE-2.0

# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.


from .nodes.flash import (
    GeminiFlashNode
)

from .nodes.imagen_bg_swap import (
    ProductBGSwapMaskNode,
    ProductBGSwapAutoMaskNode
)

from .nodes.imagen_custom_endpoint import (
    ImagenCustomEndpointNode
)

from .nodes.imagen_inpaint_insert import (
    InpaintInsertMaskNode,
    InpaintInsertAutoMaskNode,
    InpaintInsertSemanticMaskNode
)

from .nodes.imagen_inpaint_remove import (
    InpaintRemoveMaskNode,
    InpaintRemoveAutoMaskNode,
    InpaintRemoveSemanticMaskNode
)

from .nodes.imagen_maskfree_editing import (
    MaskFreeEditNode
)

from .nodes.imagen_outpaint import (
    OutpaintingNode
)

from .nodes.imagen import (
    Imagen3Node
)

from .nodes.veo import (
    Veo2Node,
    VideoPreviewNode,
    ImageToBase64Node
)


WEB_DIRECTORY = "./web"


NODE_CLASS_MAPPINGS = {

    "Gemini Flash 2.0": GeminiFlashNode,
    "Veo 2 Video Generation": Veo2Node,
    "VideoPreviewNode": VideoPreviewNode,
    "Image to B64 Node": ImageToBase64Node,

    # Imagen3 nodes
    "Image Generation 3": Imagen3Node,

    "Inpaint Insert w Mask": InpaintInsertMaskNode,
    "Inpaint Insert w AutoMask": InpaintInsertAutoMaskNode,
    "Inpaint Insert w SemanticMask": InpaintInsertSemanticMaskNode,

    "Inpaint Remove w Mask": InpaintRemoveMaskNode,
    "Inpaint Remove w AutoMask": InpaintRemoveAutoMaskNode,
    "Inpaint Remove w SemanticMask": InpaintRemoveSemanticMaskNode,

    "Imagen Product Background Swap w Mask": ProductBGSwapMaskNode,
    "Imagen Product Background Swap w AutoMask": ProductBGSwapAutoMaskNode,

    "Imagen Mask-Free Editing": MaskFreeEditNode,

    "Imagen Outpainting": OutpaintingNode,

    "Imagen Custom Endpoint": ImagenCustomEndpointNode,
}

__all__ = ['NODE_CLASS_MAPPINGS', 'WEB_DIRECTORY']
