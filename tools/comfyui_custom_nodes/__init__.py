# Copyright 2025 Google. This software is provided as-is, without warranty
# or representation for any use or purpose. Your use of it is subject to
# your agreement with Google.

"""Init nodes"""

from .src.vertexai_nodes.nodes.gemini import (
    GeminiNode
)

from .src.vertexai_nodes.nodes.imagen import (
    Imagen3Node
)

from .src.vertexai_nodes.nodes.imagen_bg_swap import (
    ProductBGSwapMaskNode,
    ProductBGSwapAutoMaskNode
)

from .src.vertexai_nodes.nodes.imagen_inpaint_insert import (
    InpaintInsertMaskNode,
    InpaintInsertAutoMaskNode,
    InpaintInsertSemanticMaskNode
)

from .src.vertexai_nodes.nodes.imagen_inpaint_remove import (
    InpaintRemoveMaskNode,
    InpaintRemoveAutoMaskNode,
    InpaintRemoveSemanticMaskNode
)

from .src.vertexai_nodes.nodes.imagen_maskfree_editing import (
    MaskFreeEditNode
)

from .src.vertexai_nodes.nodes.imagen_outpaint import (
    OutpaintingNode
)

from .src.vertexai_nodes.nodes.veo import (
    VeoNode,
    VideoPreviewNode,
    ImageToBase64Node
)

WEB_DIRECTORY = "./src/vertexai_nodes/web"

# Map all your custom nodes classes with the names
# that will be displayed in the UI.
NODE_CLASS_MAPPINGS = {

    "Gemini": GeminiNode,
    "Veo Video Generation": VeoNode,
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

}

__all__ = ['NODE_CLASS_MAPPINGS', 'WEB_DIRECTORY']
