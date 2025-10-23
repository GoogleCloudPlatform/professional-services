# Copyright 2025 Google LLC
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

from src.common.base_dto import (
    AspectRatioEnum,
    ColorAndToneEnum,
    CompositionEnum,
    LightingEnum,
    MimeTypeEnum,
    StyleEnum,
)
from src.media_templates.schema.media_template_model import IndustryEnum

TEMPLATES = [
    {
        "id": "cymbal-home-local",
        "name": "Cymbal Home",
        "description": "A showcase of Cymbal video templates.",
        "mime_type": MimeTypeEnum.VIDEO_MP4,
        "industry": IndustryEnum.HOME_APPLIANCES,
        "brand": "Cymbal",
        "tags": ["furniture", "home", "modern"],
        "local_uris": [
            "cymball_1_template.mp4",
        ],
        "generation_parameters": {
            "prompt": "Create an ad for Cymball consisting in the following: In a sunlit Scandinavian bedroom, a single, sealed Cymball box sits in the center of the otherwise empty room. From a fixed, wide-angle cinematic shot, the box trembles and opens. In a rapid, hyper-lapse sequence, furniture pieces assemble themselves precisely, quickly filling the space with a bed, wardrobe, shelves, and other decor! The action concludes as a yellow Cymball throw blanket lands perfectly on the bed, leaving a calm, fully furnished, and serene modern room. you can see the box placed in the front of the bed, with the Cymball logo at the end",
            "model": "veo-3.0-generate-001",
            "aspect_ratio": AspectRatioEnum.RATIO_16_9,
        },
    },
    {
        "id": "google-illustration-style",
        "name": "Google Illustration Style",
        "description": "A simple vector illustration with a light blue atmosphere and colorful characters, perfect for modern websites.",
        "mime_type": MimeTypeEnum.IMAGE_PNG,
        "industry": IndustryEnum.TECHNOLOGY,
        "brand": "Google",
        "tags": ["google style", "vector", "illustration", "website graphics"],
        "local_uris": ["google-illustration-style_template.png"],
        "generation_parameters": {
            "prompt": "A simple vector illustration on a white background with light blue background atmosphere and colorful characters. It features [subject in location]. A google-style vector illustration. The type of illustration you would see on a modern website.",
            "model": "imagen-4.0-ultra-generate-001",
            "aspect_ratio": AspectRatioEnum.RATIO_16_9,
            "style": StyleEnum.MODERN,
            "lighting": LightingEnum.NATURAL,
            "color_and_tone": ColorAndToneEnum.VIBRANT,
            "composition": CompositionEnum.CLOSEUP,
            "negative_prompt": "photorealistic, 3d, shadows",
        },
    },
    {
        "id": "3d-clay-stickers",
        "name": "3D Clay Stickers",
        "description": "A miniature clay animation style featuring a floating object with bright, saturated, and playful colors.",
        "mime_type": MimeTypeEnum.IMAGE_PNG,
        "industry": IndustryEnum.ART_AND_DESIGN,
        "brand": "Google",
        "tags": ["3d", "claymation", "stickers", "playful", "miniature"],
        "local_uris": ["3d-clay-stickers_template.png"],
        "generation_parameters": {
            "prompt": "A miniature clay animation 3D floating [object with attributes] on a white background. The background is white. The colors are bright and saturated, and the overall look is playful. Everything in the scene is made of colorful clay.",
            "model": "imagen-4.0-ultra-generate-001",
            "aspect_ratio": AspectRatioEnum.RATIO_1_1,
            "style": StyleEnum.MODERN,
            "lighting": LightingEnum.STUDIO_LIGHT,
            "color_and_tone": ColorAndToneEnum.VIBRANT,
            "composition": CompositionEnum.CLOSEUP,
            "negative_prompt": "photorealistic, dark, gloomy",
        },
    },
    {
        "id": "enamel-pins",
        "name": "Enamel Pins",
        "description": "Creates a stylish enamel pin with a gold border on a white background, perfect for custom merchandise mockups.",
        "mime_type": MimeTypeEnum.IMAGE_PNG,
        "industry": IndustryEnum.FASHION_AND_APPAREL,
        "brand": "Google",
        "tags": ["enamel pin", "merchandise", "mockup", "gold border"],
        "local_uris": ["enamel-pins_template.png"],
        "generation_parameters": {
            "prompt": "An enamel pin with a gold border on a white background. It features a [object with attributes]. Enamel pin on white background. It looks like a pin you might find on a jean jacket or backpack.",
            "model": "imagen-4.0-ultra-generate-001",
            "aspect_ratio": AspectRatioEnum.RATIO_1_1,
            "style": StyleEnum.MODERN,
            "lighting": LightingEnum.STUDIO,
            "color_and_tone": ColorAndToneEnum.VIBRANT,
            "composition": CompositionEnum.CLOSEUP,
            "negative_prompt": "shadows, realistic, human",
        },
    },
    {
        "id": "paper-craft",
        "name": "Paper Craft",
        "description": "A construction paper craft depiction, made of textured pieces. Looks like an art student project.",
        "mime_type": MimeTypeEnum.IMAGE_PNG,
        "industry": IndustryEnum.ART_AND_DESIGN,
        "brand": "Google",
        "tags": ["paper craft", "construction paper", "artistic", "textured"],
        "local_uris": ["paper-craft_template.png"],
        "generation_parameters": {
            "prompt": "A construction paper craft depicting a [object with attributes] on a white background. Made of pieces of textured construction paper pieces. It looks like something you would expect from an art student.",
            "model": "imagen-4.0-ultra-generate-001",
            "aspect_ratio": AspectRatioEnum.RATIO_1_1,
            "style": StyleEnum.MODERN,
            "lighting": LightingEnum.NATURAL,
            "color_and_tone": ColorAndToneEnum.PASTEL,
            "composition": CompositionEnum.CLOSEUP,
            "negative_prompt": "photorealistic, 3d, glossy",
        },
    },
    {
        "id": "stylized-portraits",
        "name": "Stylized Portraits",
        "description": "Generates a close-up portrait in a graphic novel, vector art style with detailed subject descriptions.",
        "mime_type": MimeTypeEnum.IMAGE_PNG,
        "industry": IndustryEnum.ART_AND_DESIGN,
        "brand": "Google",
        "tags": ["portrait", "graphic novel", "vector", "character design"],
        "local_uris": ["stylized-portraits_template.png"],
        "generation_parameters": {
            "prompt": "Close-up portrait. Graphic novel style. Vector art. [Subject]. [Profession/Role]. [Physical Traits]. [Clothing/Apparel Details]. [Activity/Action]. [Setting Details]. [Background Elements].",
            "model": "imagen-4.0-ultra-generate-001",
            "aspect_ratio": AspectRatioEnum.RATIO_3_4,
            "style": StyleEnum.SKETCH,
            "lighting": LightingEnum.DRAMATIC,
            "color_and_tone": ColorAndToneEnum.VIBRANT,
            "composition": CompositionEnum.CLOSEUP,
            "negative_prompt": "photorealistic, blurry, deformed hands",
        },
    },
    {
        "id": "medieval-portraits",
        "name": "Medieval Portraits",
        "description": "Creates a realistic, line art vector portrait in a medieval style on a clean white background.",
        "mime_type": MimeTypeEnum.IMAGE_PNG,
        "industry": IndustryEnum.ENTERTAINMENT,
        "brand": "Google",
        "tags": ["medieval", "portrait", "line art", "vector", "historical"],
        "local_uris": ["medieval-portraits_template.png"],
        "generation_parameters": {
            "prompt": "Line art, vector art. Portrait, realistic. White background. Medieval. [Role] [Physical Traits]. [Clothing]. [Facial Expression/Emotion]",
            "model": "imagen-4.0-ultra-generate-001",
            "aspect_ratio": AspectRatioEnum.RATIO_3_4,
            "style": StyleEnum.SKETCH,
            "lighting": LightingEnum.NATURAL,
            "color_and_tone": ColorAndToneEnum.MONOCHROME,
            "composition": CompositionEnum.CLOSEUP,
            "negative_prompt": "color, shading, 3d",
        },
    },
    {
        "id": "cake-maker",
        "name": "Cakemaker",
        "description": "Designs a large sheet cake with a frosting drawing on top, shot from an overhead perspective.",
        "mime_type": MimeTypeEnum.IMAGE_PNG,
        "industry": IndustryEnum.FOOD_AND_BEVERAGE,
        "brand": "Google",
        "tags": ["cake", "food", "baking", "frosting art", "overhead shot"],
        "local_uris": ["cake-maker_template.png"],
        "generation_parameters": {
            "prompt": "A large sheet cake on a gold foil cardboard with white frosting and decorative piping all around. The cake is on a white background, shot from overhead. On top of the cake there is a frosting drawing of [object with attributes].",
            "model": "imagen-4.0-ultra-generate-001",
            "aspect_ratio": AspectRatioEnum.RATIO_4_3,
            "style": StyleEnum.PHOTOREALISTIC,
            "lighting": LightingEnum.STUDIO,
            "color_and_tone": ColorAndToneEnum.VIBRANT,
            "composition": CompositionEnum.SHOT_FROM_ABOVE,
            "negative_prompt": "dark, messy, out of frame",
        },
    },
]
