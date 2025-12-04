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

from src.common.base_dto import AspectRatioEnum, MimeTypeEnum
from src.common.schema.media_item_model import AssetRoleEnum
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
            "cymbal-home-local.mp4",
        ],
        "local_thumbnail_uris": [
            "cymbal-home-local-thumbnail.png",
        ],
        "generation_parameters": {
            "prompt": "Create an ad for Cymball consisting in the following: In a sunlit Scandinavian bedroom, a single, sealed Cymball box sits in the center of the otherwise empty room. From a fixed, wide-angle cinematic shot, the box trembles and opens. In a rapid, hyper-lapse sequence, furniture pieces assemble themselves precisely, quickly filling the space with a bed, wardrobe, shelves, and other decor! The action concludes as a yellow Cymball throw blanket lands perfectly on the bed, leaving a calm, fully furnished, and serene modern room. you can see the box placed in the front of the bed, with the Cymball logo at the end",
            "model": "veo-3.0-generate-001",
            "aspect_ratio": AspectRatioEnum.RATIO_16_9,
        },
    },
    {
        "id": "cymbal-suv-adventure-local",
        "name": "Cymbal SUV Adventure",
        "description": "A rugged Cymbal SUV is revealed from a crate in a desert basecamp.",
        "mime_type": MimeTypeEnum.VIDEO_MP4,
        "industry": IndustryEnum.AUTOMOTIVE,
        "brand": "Cymbal",
        "tags": ["suv", "adventure", "desert", "automotive"],
        "local_uris": ["cymbal-suv-adventure-local.mp4"],
        "local_thumbnail_uris": ["cymbal-suv-adventure-local-thumbnail.png"],
        "input_gcs_uris": [
            {
                "local_uri": "cymbal-suv-local.png",
                "mime_type": "image/png",
                "role": AssetRoleEnum.IMAGE_REFERENCE_ASSET,
            },
        ],
        "generation_parameters": {
            "prompt": "In a gritty, epic cinematic shot set within a Moab desert canyon during the dramatic golden hour, a rugged mechanical expedition crate audibly unlocks and its panels fold outward. The movement reveals a dirty, mud-splattered Cymbal SUV at the center of an instantly formed, adventure-ready basecamp, complete with a deployed rooftop tent and glowing LED lights. The camera slowly pushes in on the stunning scene, showcasing the rugged Cymbal SUV ready for exploration as dust swirls in the warm light.",
            "model": "veo-3.0-generate-001",
            "aspect_ratio": AspectRatioEnum.RATIO_16_9,
        },
    },
    {
        "id": "cymbal-supercar-neptune-local",
        "name": "Cymbal Supercar Neptune",
        "description": "A Cymbal supercar is forged from the ocean by Neptune's trident.",
        "mime_type": MimeTypeEnum.VIDEO_MP4,
        "industry": IndustryEnum.AUTOMOTIVE,
        "brand": "Cymbal",
        "tags": ["supercar", "ocean", "fantasy", "automotive"],
        "local_uris": ["cymbal-supercar-neptune-local.mp4"],
        "local_thumbnail_uris": ["cymbal-supercar-neptune-local-thumbnail.png"],
        "input_gcs_uris": [
            {
                "local_uri": "cymbal-supercar-local.png",
                "mime_type": "image/png",
                "role": AssetRoleEnum.IMAGE_REFERENCE_ASSET,
            },
        ],
        "generation_parameters": {
            "prompt": "From the depths of the ocean, the power of Neptune's trident is unleashed, summoning a vortex of water and light that forges the Cymbal supercar. Opening Shot: The camera glides over the seabed and discovers a massive, ancient bronze trident, half-buried in the sand. It begins to hum and glow with a brilliant aquamarine light. Main Action: The glowing trident unleashes its power, creating a massive, swirling underwater vortex. Sand, bubbles, and light are pulled into its powerful spin, with the trident at its center. Solidification: Within the vortex, the chaotic currents of water are hydro-dynamically sculpted into the sleek, aerodynamic form of a Cymbal supercar. The iconic logo on the front grille materializes first, glowing brightly. The water-form then solidifies into 'Bianco Audace' metallic white. The Breach: The fully formed car rockets upwards from the depths. It bursts through the ocean surface in a spectacular explosion of water and spray, captured in slow motion. It lands perfectly on a wet, black-sand beach at twilight, water streaming off its flawless body. Start with a slow, exploratory glide through the deep water. Circle the glowing trident as it activates. Get caught in the vortex, spinning with the forming car. Follow the car as it rockets upwards, capturing the breach in epic slow motion. End on a low, wide-angle shot of the car on the beach, looking powerful and serene.",
            "model": "veo-3.0-generate-001",
            "aspect_ratio": AspectRatioEnum.RATIO_16_9,
        },
    },
    {
        "id": "cymbal-showroom-reveal-local",
        "name": "Cymbal Showroom Reveal",
        "description": "A Cymbal vehicle is revealed in a futuristic showroom that assembles around it.",
        "mime_type": MimeTypeEnum.VIDEO_MP4,
        "industry": IndustryEnum.AUTOMOTIVE,
        "brand": "Cymbal",
        "tags": ["automotive", "futuristic", "showroom", "reveal"],
        "local_uris": [
            "cymbal-showroom-reveal-local.mp4",
        ],
        "local_thumbnail_uris": [
            "cymbal-showroom-reveal-local-thumbnail.png",
        ],
        "input_gcs_uris": [
            {
                "local_uri": "cymbal-supercar-local.png",
                "mime_type": "image/png",
                "role": AssetRoleEnum.IMAGE_REFERENCE_ASSET,
            },
            {
                "local_uri": "cymbal_logo.png",
                "mime_type": "image/png",
                "role": AssetRoleEnum.IMAGE_REFERENCE_ASSET,
            },
        ],
        "generation_parameters": {
            "prompt": "In a wide, cinematic shot, a minimalist, Cymbal-branded crate with glowing seams is centered in an empty, futuristic space. The crate's panels retract smoothly and silently, revealing a pristine Cymbal vehicle. Simultaneously, the surrounding area rapidly and precisely transforms into a sleek, minimalist Cymbal showroom, with a charging station and display panels rising into place, leaving the car as the inviting centerpiece under clean, ambient light. Attached are the Cymbal supercar and the Cymbal Logo!!",
            "model": "veo-3.0-generate-001",
            "aspect_ratio": AspectRatioEnum.RATIO_16_9,
        },
    },
    {
        "id": "cymbal-watch-assembly-local",
        "name": "Cymbal Watch Assembly",
        "description": "A Cymbal watch assembles itself from its components in a sleek studio.",
        "mime_type": MimeTypeEnum.VIDEO_MP4,
        "industry": IndustryEnum.LUXURY_GOODS,
        "brand": "Cymbal",
        "tags": ["watch", "luxury", "assembly", "studio"],
        "local_uris": ["cymbal-watch-assembly-local.mp4"],
        "local_thumbnail_uris": ["cymbal-watch-assembly-local-thumbnail.png"],
        "input_gcs_uris": [
            {
                "local_uri": "cymbal_logo.png",
                "mime_type": "image/png",
                "role": AssetRoleEnum.IMAGE_REFERENCE_ASSET,
            },
            {
                "local_uri": "cymbal_logo_text.png",
                "mime_type": "image/png",
                "role": AssetRoleEnum.IMAGE_REFERENCE_ASSET,
            },
        ],
        "generation_parameters": {
            "prompt": "In a sleek black studio, the golden Cymbal crown and logo appear with a metallic glint, accompanied by a deep, mechanical ticking. The logo then deconstructs, its letters unfolding into a cloud of tiny, elegant watch components like gears, springs, and bezels that float in slow motion. With magnetic precision, these parts begin to snap together, assembling the intricate internal mechanism first, followed by the dial, case, and bracelet, all with satisfying high-end clicks. Finally, the fully assembled Cymbal watch floats in the studio light in a vertical position, its polished surfaces reflecting the light as the camera does a final, slow orbit to reveal the finished timepiece. The cyclops lens should mark 28.",
            "model": "veo-3.0-generate-001",
            "aspect_ratio": AspectRatioEnum.RATIO_1_1,
        },
    },
    {
        "id": "cymbal-chocolate-fantasy-local",
        "name": "Cymbal Chocolate Fantasy",
        "description": "A surreal and magical ad for Cymbal chocolate in a whimsical fantasy world.",
        "mime_type": MimeTypeEnum.VIDEO_MP4,
        "industry": IndustryEnum.FOOD_AND_BEVERAGE,
        "brand": "Cymbal",
        "tags": ["chocolate", "fantasy", "surreal", "food"],
        "local_uris": ["cymbal-chocolate-fantasy-local.mp4"],
        "local_thumbnail_uris": [
            "cymbal-chocolate-fantasy-local-thumbnail.png"
        ],
        "input_gcs_uris": [
            {
                "local_uri": "cymbal_chocolate.png",
                "mime_type": "image/png",
                "role": AssetRoleEnum.IMAGE_REFERENCE_ASSET,
            },
            {
                "local_uri": "cymbal_logo.png",
                "mime_type": "image/png",
                "role": AssetRoleEnum.IMAGE_REFERENCE_ASSET,
            },
            {
                "local_uri": "cymbal_logo_text.png",
                "mime_type": "image/png",
                "role": AssetRoleEnum.IMAGE_REFERENCE_ASSET,
            },
        ],
        "generation_parameters": {
            "prompt": "Make a video about A surreal and magical advertisement for (Cymbal) in a (whimsical chocolate fantasy world). A (floating Cymbal chocolate) is surrounded by a dynamic swirl of (creamy chocolate and cream) and flying hazelnuts, glowing softly with light streaks. The background features floating islands dripping with chocolate, misty waters below, and lush trees with fruit-like hazelnuts. In the distance, the Cymbal logo is engraved on a large stone. Cinematic lighting, ultra-realistic texture, highly detailed, dreamlike atmosphere.",
            "model": "veo-3.0-generate-001",
            "aspect_ratio": AspectRatioEnum.RATIO_16_9,
        },
    },
    {
        "id": "cymbal-cat-food-local",
        "name": "Cymbal Cat Food",
        "description": "A sleek cat enjoys its Cymbal food in a modern home.",
        "mime_type": MimeTypeEnum.VIDEO_MP4,
        "industry": IndustryEnum.PET_SUPPLIES,
        "brand": "Cymbal",
        "tags": ["cat", "pet food", "home", "modern"],
        "local_uris": ["cymbal-cat-food-local.mp4"],
        "local_thumbnail_uris": ["cymbal-cat-food-local-thumbnail.png"],
        "input_gcs_uris": [
            {
                "local_uri": "cymbal_logo.png",
                "mime_type": "image/png",
                "role": AssetRoleEnum.IMAGE_REFERENCE_ASSET,
            },
            {
                "local_uri": "cymbal_logo_text.png",
                "mime_type": "image/png",
                "role": AssetRoleEnum.IMAGE_REFERENCE_ASSET,
            },
        ],
        "generation_parameters": {
            "prompt": "Create a great as for Cymbal. A sleek cat gracefully approaches and eats from its food bowl in a modern home, showcasing enjoyment and satisfaction, concluding with the sound of the cat meowing, the brand logo and jingle. Make sure you add the Cymbal logo at the end.",
            "model": "veo-3.0-generate-001",
            "aspect_ratio": AspectRatioEnum.RATIO_16_9,
        },
    },
    {
        "id": "cymbal-vacuum-power-local",
        "name": "Cymbal Vacuum Power",
        "description": "A journey through the powerful cyclonic chambers of a Cymbal vacuum.",
        "mime_type": MimeTypeEnum.VIDEO_MP4,
        "industry": IndustryEnum.HOME_APPLIANCES,
        "brand": "Cymbal",
        "tags": ["vacuum", "home", "power", "clean"],
        "local_uris": ["cymbal-vacuum-power-local.mp4"],
        "local_thumbnail_uris": ["cymbal-vacuum-power-local-thumbnail.png"],
        "input_gcs_uris": [
            {
                "local_uri": "cymbal_vaccum.png",
                "mime_type": "image/png",
                "role": AssetRoleEnum.IMAGE_REFERENCE_ASSET,
            },
            {
                "local_uri": "cymbal_logo_text.png",
                "mime_type": "image/png",
                "role": AssetRoleEnum.IMAGE_REFERENCE_ASSET,
            },
        ],
        "generation_parameters": {
            "prompt": "From a low-angle tracking shot, a Cymbal vacuum glides across a dirty carpet, leaving a satisfyingly clean and vibrant path with each whoosh. The vacuum head is then detached, and the open suction tube is brought directly towards the camera, making the screen warp and vibrate as if being pulled inside by the intensifying sound. The view transitions into a fluid, first-person journey through the vacuum's glowing and precisely engineered internal cyclonic chambers and high-speed filters. Finally, the camera exits the mechanism into a clean white space, where the Cymbal logo appears with a subtle, clear chime.",
            "model": "veo-3.0-generate-001",
            "aspect_ratio": AspectRatioEnum.RATIO_16_9,
        },
    },
    {
        "id": "product-flat-lay-1-local",
        "name": "Product Flat Lay 1",
        "description": "Create an organized 'knolling' style flat lay of products from an image.",
        "mime_type": MimeTypeEnum.IMAGE_PNG,
        "industry": IndustryEnum.FASHION_AND_APPAREL,
        "brand": "Cymbal",
        "tags": ["fashion", "flat lay", "knolling", "editing"],
        "local_uris": ["product-flat-lay-1-local.png"],
        "input_gcs_uris": [
            {
                "local_uri": "cymbal_woman_model.png",
                "mime_type": "image/png",
                "role": AssetRoleEnum.IMAGE_REFERENCE_ASSET,
            },
        ],
        "generation_parameters": {
            "prompt": "Your goal is to create a 'product flat lay' from the image! Step 1: Identify and segment every featured product and article of clothing (e.g., shirt, pants, shoes, bag, sunglasses). Step 2: Create a clean canvas with a solid white background. Step 3: Composite all segmented items from Step 1 onto the canvas. Step 4: Arrange the items in an organized, 'knolling' style (i.e., laid flat, organized at 90-degree angles). Step 5: The final image must contain only the products, with no part of the person or original scene visible.",
            "model": "gemini-2.5-flash-image-preview",
            "aspect_ratio": AspectRatioEnum.RATIO_1_1,
        },
    },
    {
        "id": "pose-variation-sheet-local",
        "name": "Pose Variation Sheet",
        "description": "Generate multiple new poses for a subject while keeping their identity, apparel, and background.",
        "mime_type": MimeTypeEnum.IMAGE_PNG,
        "industry": IndustryEnum.FASHION_AND_APPAREL,
        "brand": "Cymbal",
        "tags": ["fashion", "pose", "variation", "editing"],
        "local_uris": ["pose-variation-sheet-local.png"],
        "input_gcs_uris": [
            {
                "local_uri": "cymbal_woman_model.png",
                "mime_type": "image/png",
                "role": AssetRoleEnum.IMAGE_REFERENCE_ASSET,
            },
        ],
        "generation_parameters": {
            "prompt": "Your goal is to create a 'pose variation sheet' for the subject in the provided image. Preserve (Do Not Change): Subject Identity: The face, hair, and body type must be identical to the original. Apparel: The subject must be wearing the exact same clothes. Background: Maintain the original background scene and lighting. Generate (New Poses): Create 3 new images of the subject in the following distinct poses: [Pose 1: e.g., 'Leaning against the wall casually'] [Pose 2: e.g., 'Arms raised in celebration'] [Pose 3: e.g., 'Crouching down to look at something'] [Pose 4. e.g., 'Surprise me with this one!']",
            "model": "gemini-2.5-flash-image-preview",
            "aspect_ratio": AspectRatioEnum.RATIO_3_4,
        },
    },
    {
        "id": "virtual-garment-transfer-local",
        "name": "Virtual Garment Transfer",
        "description": "Transfer a garment from one person to another, realistically adapting it to the new pose.",
        "mime_type": MimeTypeEnum.IMAGE_PNG,
        "industry": IndustryEnum.FASHION_AND_APPAREL,
        "brand": "Cymbal",
        "tags": ["fashion", "vto", "editing", "garment transfer"],
        "local_uris": ["virtual-garment-transfer-local.png"],
        "input_gcs_uris": [
            {
                "local_uri": "cymbal_man_model.png",
                "mime_type": "image/png",
                "role": AssetRoleEnum.IMAGE_REFERENCE_ASSET,
            },
            {
                "local_uri": "cymbal_layout_clothes.png",
                "mime_type": "image/png",
                "role": AssetRoleEnum.IMAGE_REFERENCE_ASSET,
            },
        ],
        "generation_parameters": {
            "prompt": "Task: Virtual Garment Transfer Input A (Target Model): [image of the person to dress] Input B (Garment Source): [image of the clothing on another person/mannequin] Instructions: Identity Lock (Input A): Preserve 100% of the target model's face, hair, body type, and pose. Garment Extraction (Input B): Isolate only the full apparel ensemble (e.g., 'the denim jacket and white skirt') from Input B. Discard the original model, background, and body parts. Composite & Re-Drape: Intelligently fit and conform the extracted garment onto the target model (A). The clothing must realistically adapt to the model's pose, creating all new, necessary folds, shadows, and highlights to match the new body position. Output: A single, photorealistic image of the target model (A) wearing the ensemble from (B).",
            "model": "gemini-2.5-flash-image-preview",
            "aspect_ratio": AspectRatioEnum.RATIO_3_4,
        },
    },
    {
        "id": "photorealistic-denoising-local",
        "name": "Photorealistic Denoising",
        "description": "Enhance a 3D pre-rendered image to achieve hyperrealistic detail and lighting.",
        "mime_type": MimeTypeEnum.IMAGE_PNG,
        "industry": IndustryEnum.TECHNOLOGY,
        "brand": "Cymbal",
        "tags": ["3d", "photorealism", "denoising", "enhancement"],
        "local_uris": ["photorealistic-denoising-local.png"],
        "input_gcs_uris": [
            {
                "local_uri": "pre_render_room.png",
                "mime_type": "image/png",
                "role": AssetRoleEnum.IMAGE_REFERENCE_ASSET,
            },
        ],
        "generation_parameters": {
            "prompt": "Task: Photorealistic Denoising and Enhancement Input Image: [Uploaded Pre-rendered 3D Image] Instructions: Scene Fidelity Lock: Maintain 100% of the geometric structure, object placement, and camera angle from the input image. Do not introduce new objects or alter the scene composition. Material & Texture Enhancement: Generatively refine all materials and textures to achieve hyperrealistic detail. Focus on realistic subsurface scattering for skin, intricate fabric weaves, accurate metallic reflections, and subtle imperfections. Lighting & Shadows: Enhance existing lighting to be more physically accurate. Introduce subtle volumetric effects, realistic global illumination, and crisp, natural soft shadows appropriate for the scene's light sources. Post-Processing: Apply a subtle cinematic grade, including film grain, bloom (where appropriate), and depth of field, without altering the core scene. Output: A photorealistic image that looks like a photograph taken from the input 3D scene.",
            "model": "gemini-2.5-flash-image-preview",
            "aspect_ratio": AspectRatioEnum.RATIO_16_9,
        },
    },
    {
        "id": "floor-replacement-local",
        "name": "Floor Replacement",
        "description": "Replace the floor in one image with the texture from another.",
        "mime_type": MimeTypeEnum.IMAGE_PNG,
        "industry": IndustryEnum.HOME_APPLIANCES,
        "brand": "Cymbal",
        "tags": ["editing", "inpainting", "interior design"],
        "local_uris": ["floor-replacement-local.png"],
        "input_gcs_uris": [
            {
                "local_uri": "floor_texture_marmol.png",
                "mime_type": "image/png",
                "role": AssetRoleEnum.IMAGE_REFERENCE_ASSET,
            },
            {
                "local_uri": "living_room.png",
                "mime_type": "image/png",
                "role": AssetRoleEnum.IMAGE_REFERENCE_ASSET,
            },
        ],
        "generation_parameters": {
            "prompt": "Change the floor of the first image attached, to be of the marmol in the second attached image.",
            "model": "gemini-2.5-flash-image-preview",
            "aspect_ratio": AspectRatioEnum.RATIO_4_3,
        },
    },
    {
        "id": "painting-replacement-local",
        "name": "Painting Replacement",
        "description": "Replace the paintings in a living room with a different painting.",
        "mime_type": MimeTypeEnum.IMAGE_PNG,
        "industry": IndustryEnum.HOME_APPLIANCES,
        "brand": "Cymbal",
        "tags": ["editing", "inpainting", "interior design"],
        "local_uris": ["painting-replacement-local.png"],
        "input_gcs_uris": [
            {
                "local_uri": "modern_painting.png",
                "mime_type": "image/png",
                "role": AssetRoleEnum.IMAGE_REFERENCE_ASSET,
            },
            {
                "local_uri": "living_room.png",
                "mime_type": "image/png",
                "role": AssetRoleEnum.IMAGE_REFERENCE_ASSET,
            },
        ],
        "generation_parameters": {
            "prompt": "Replace the paintings in the living room of the first image with the painting provided on the second image.",
            "model": "gemini-2.5-flash-image-preview",
            "aspect_ratio": AspectRatioEnum.RATIO_4_3,
        },
    },
    {
        "id": "r2v-orbital-render-local",
        "name": "R2V Orbital Render",
        "description": "Reconstruct a 3D object from orthogonal views and render an orbital video.",
        "mime_type": MimeTypeEnum.VIDEO_MP4,
        "industry": IndustryEnum.TECHNOLOGY,
        "brand": "Cymbal",
        "tags": ["3d", "r2v", "video", "product"],
        "local_uris": ["r2v-orbital-render-local.mp4"],
        "local_thumbnail_uris": ["r2v-orbital-render-local-thumbnail.png"],
        "input_gcs_uris": [
            {
                "local_uri": "cymbal_jersey.png",
                "mime_type": "image/png",
                "role": AssetRoleEnum.IMAGE_REFERENCE_ASSET,
            },
        ],
        "generation_parameters": {
            "prompt": "Task: 3D Object Reconstruction & Orbital Video Render. Module: R2V (Image-to-3D) Subject: The input images are orthogonal views of a single, rigid 3D object. Keyframe Assignment: Input_A [Front_Image] = 0-degree view (Z+) Input_B [Left_Image] = 90-degree view (X-) Input_C [Back_Image] = 180-degree view (Z-) Interpolation: Generatively compute the missing 270-degree (right-side) view and all intermediary angles with high geometric and textural fidelity. Action: Generate a 5-second, seamless loop. Camera Path: Animate a 360-degree clockwise camera orbit at a constant velocity, maintaining an eye-level, 10-degree downward-angle view of the product. Environment: Render on a seamless #F2F2F2 background with soft, diffuse studio lighting.",
            "model": "veo-3.0-generate-001",
            "aspect_ratio": AspectRatioEnum.RATIO_1_1,
        },
    },
    {
        "id": "dynamic-360-model-local",
        "name": "Dynamic 360 Model",
        "description": "Generate a 360-degree video of a model with engaging animation from a single image.",
        "mime_type": MimeTypeEnum.VIDEO_MP4,
        "industry": IndustryEnum.FASHION_AND_APPAREL,
        "brand": "Cymbal",
        "tags": ["fashion", "360", "video", "model"],
        "local_uris": ["dynamic-360-model-local.mp4"],
        "local_thumbnail_uris": ["dynamic-360-model-local-thumbnail.png"],
        "input_gcs_uris": [
            {
                "local_uri": "cymbal_woman_model.png",
                "mime_type": "image/png",
                "role": AssetRoleEnum.IMAGE_REFERENCE_ASSET,
            },
        ],
        "generation_parameters": {
            "prompt": "Task: Generate a dynamic 360-degree model presentation video with engaging character animation. Input Reference: [Upload Single Front-Facing Image of Model] Identity Lock: The subject's facial identity, hairstyle, body type, and full outfit from the input image must be maintained with 100% consistency throughout the video. Animation Sequence (8-second seamless loop): Camera Orbit (Continuous): Execute a smooth, 360-degree clockwise camera orbit around the model at a constant, even velocity, completing one full rotation in 8 seconds. Head Tracking (Continuous): The model's head and gaze must continuously track the camera, ensuring they maintain consistent eye contact throughout the entire 360-degree rotation. Body Pose Transitions (Synchronized with Orbit): 0-2s (Front to Left Quarter): Model subtly shifts weight, perhaps a slight lean to one side, looking confident and poised. 2-4s (Left Quarter to Back Quarter): Model adjusts their shoulders or gently places a hand on their hip. 4-6s (Back Quarter to Right Quarter): Model performs a subtle, natural pose adjustment, e.g., a slight arm movement, while still maintaining eye contact with the camera. Facial Expression (Culminating): 0-6s: Maintain a pleasant, neutral, or subtly expressive look, consistent with the initial pose. 6-8s (Right Quarter to Front): As the camera completes its 360-degree loop and returns to the front, the model performs a warm, genuine smile, which should hold for the last second of the loop, transitioning seamlessly back to the initial neutral expression for a perfect loop. Lighting & Environment: Render the model on a clean, seamless #F2F2F2 (light gray) studio background. Use soft, professional studio lighting that enhances the model and clothing without harsh shadows. Output: A high-quality, photorealistic video that seamlessly loops, showcasing the model from all angles with dynamic, engaging action.",
            "model": "veo-3.0-generate-001",
            "aspect_ratio": AspectRatioEnum.RATIO_9_16,
        },
    },
    {
        "id": "presenter-video-local",
        "name": "Presenter Video",
        "description": "Generate a video of a presenter talking about a product with perfect lip-sync.",
        "mime_type": MimeTypeEnum.VIDEO_MP4,
        "industry": IndustryEnum.TECHNOLOGY,
        "brand": "Cymbal",
        "tags": ["presenter", "lip-sync", "product", "advertisement"],
        "local_uris": ["presenter-video-local.mp4"],
        "local_thumbnail_uris": ["presenter-video-local-thumbnail.png"],
        "input_gcs_uris": [
            {
                "local_uri": "cymbal_man_model.png",
                "mime_type": "image/png",
                "role": AssetRoleEnum.IMAGE_REFERENCE_ASSET,
            },
            {
                "local_uri": "pixel_9_back.png",
                "mime_type": "image/png",
                "role": AssetRoleEnum.IMAGE_REFERENCE_ASSET,
            },
            {
                "local_uri": "pixel_9_front.png",
                "mime_type": "image/png",
                "role": AssetRoleEnum.IMAGE_REFERENCE_ASSET,
            },
        ],
        "generation_parameters": {
            "prompt": "Subject: Generate a high-resolution, 4K video of the presenter from [Image 1]. Action: The presenter is standing, holding the product defined by [Image 2] and [Image 3] (the Pixel 9) in their hand. The presenter is looking at the camera and talking, performing the script from the [Audio Script] input. Key Details: Lip Sync: The presenter's lip movements must be perfectly synchronized with the provided audio. Product Integration: The product (Pixel 9) must be held naturally in the presenter's hand, using the textures and details from [Image 2] and [Image 3]. Gestures: As the presenter talks, they should use their free hand for natural gestures and subtly rotate the hand holding the Pixel 9 to showcase its design, screen, and camera bar. Scene & Style: Setting: A clean, modern, minimalist tech studio with bright, professional lighting. Style: Cinematic, polished, professional product advertisement.",
            "model": "veo-3.0-generate-001",
            "aspect_ratio": AspectRatioEnum.RATIO_16_9,
        },
    },
    {
        "id": "r2v-orbital-render-2-local",
        "name": "R2V Orbital Render 2",
        "description": "Reconstruct a 3D object from orthogonal views and render an orbital video.",
        "mime_type": MimeTypeEnum.VIDEO_MP4,
        "industry": IndustryEnum.TECHNOLOGY,
        "brand": "Cymbal",
        "tags": ["3d", "r2v", "video", "product"],
        "local_uris": ["r2v-orbital-render-2-local.mp4"],
        "local_thumbnail_uris": ["r2v-orbital-render-2-local-thumbnail.png"],
        "input_gcs_uris": [
            {
                "local_uri": "pixel_9_front.png",
                "mime_type": "image/png",
                "role": AssetRoleEnum.IMAGE_REFERENCE_ASSET,
            },
            {
                "local_uri": "pixel_9_back.png",
                "mime_type": "image/png",
                "role": AssetRoleEnum.IMAGE_REFERENCE_ASSET,
            },
            {
                "local_uri": "pixel_9_back_2.png",
                "mime_type": "image/png",
                "role": AssetRoleEnum.IMAGE_REFERENCE_ASSET,
            },
        ],
        "generation_parameters": {
            "prompt": "Task: 3D Object Reconstruction & Orbital Video Render. Module: R2V (Image-to-3D) Subject: The input images are orthogonal views of a single, rigid 3D object. Keyframe Assignment: Input_A [Front_Image] = 0-degree view (Z+) Input_B [Left_Image] = 90-degree view (X-) Input_C [Back_Image] = 180-degree view (Z-) Interpolation: Generatively compute the missing 270-degree (right-side) view and all intermediary angles with high geometric and textural fidelity. Action: Generate a 5-second, seamless loop. Camera Path: Animate a 360-degree clockwise camera orbit at a constant velocity, maintaining an eye-level, 10-degree downward-angle view of the product. Environment: Render on a seamless #F2F2F2 background with soft, diffuse studio lighting.",
            "model": "veo-3.0-generate-001",
            "aspect_ratio": AspectRatioEnum.RATIO_1_1,
        },
    },
]
