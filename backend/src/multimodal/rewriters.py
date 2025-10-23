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

# Random Prompt Templates
RANDOM_IMAGE_PROMPT_TEMPLATE = """
Generate a single, random, creative, and visually descriptive prompt suitable for an AI image generator.
- First, write the main Creative Prompt as a single, evocative paragraph. This paragraph must paint a complete picture by describing:
- The Subject and Action: What is the main focus and what is it doing?
- The Scene: What is the environment or background?
- The Lighting: What is the quality and style of the light (e.g., 'dramatic backlighting', 'soft morning light')?
- The Camera Perspective: What is the shot type or angle (e.g., 'macro close-up', 'ultra-wide aerial shot')?

After the main prompt, on separate lines, provide the following Technical Parameters:
- Style: Suggest a primary visual style (e.g., 'Photorealistic', 'Fantasy Art', 'Studio Photography').
- Composition: Suggest a compositional rule (e.g., 'Rule of Thirds', 'Symmetrical Framing', 'Leading Lines').
- Color and Tone: Describe the desired color palette and emotional tone (e.g., 'Vibrant and contrasting, joyful tone', 'Muted earth tones, melancholic and somber').
- Aspect Ratio: Suggest an appropriate aspect ratio (e.g., '16:9', '1:1', '4:3').
- Negative Prompt: List common elements to exclude for higher quality results (e.g., 'blurry, deformed, text, watermark, ugly, low quality').
"""

RANDOM_VIDEO_PROMPT_TEMPLATE = """Generate a single, random, creative, and visually descriptive prompt suitable for an AI Video generator. The prompt should describe a complete, short scene with a clear beginning, middle, and end. Include specific details about the subject and the sequence of actions, the environment and lighting, and the overall visual aesthetic. Crucially, describe the camera work, including movements (e.g., 'slow dolly-in', 'sweeping crane shot') and angles. Finally, suggest the sound design or key audio elements."""

RANDOM_AUDIO_PROMPT_TEMPLATE = """ """


# Rewrite Text Prompt Templates
REWRITE_IMAGE_TEXT_PROMPT_TEMPLATE = """
Generate a single, random, creative, and visually descriptive prompt suitable for an AI image generator.
- First, write the main Creative Prompt as a single, evocative paragraph. This paragraph must paint a complete picture by describing:
- The Subject and Action: What is the main focus and what is it doing?
- The Scene: What is the environment or background?
- The Lighting: What is the quality and style of the light (e.g., 'dramatic backlighting', 'soft morning light')?
- The Camera Perspective: What is the shot type or angle (e.g., 'macro close-up', 'ultra-wide aerial shot')?

After the main prompt, on separate lines, provide the following Technical Parameters:
- Style: Suggest a primary visual style (e.g., 'Photorealistic', 'Fantasy Art', 'Studio Photography').
- Composition: Suggest a compositional rule (e.g., 'Rule of Thirds', 'Symmetrical Framing', 'Leading Lines').
- Color and Tone: Describe the desired color palette and emotional tone (e.g., 'Vibrant and contrasting, joyful tone', 'Muted earth tones, melancholic and somber').
- Aspect Ratio: Suggest an appropriate aspect ratio (e.g., '16:9', '1:1', '4:3').
- Negative Prompt: List common elements to exclude for higher quality results (e.g., 'blurry, deformed, text, watermark, ugly, low quality').

IMPORTANT!!: JUST RETURN THE REWRITTEN PROMPT DIRECTLY, YOU DON'T NEED TO CLARIFY THAT.

The User Prompt to rewrite:
'{}'
"""

REWRITE_VIDEO_TEXT_PROMPT_TEMPLATE = """Please rewrite the following prompt suitable for an AI Video generator. The prompt should describe a complete, short scene with a clear beginning, middle, and end. Include specific details about the subject and the sequence of actions, the environment and lighting, and the overall visual aesthetic. Crucially, describe the camera work, including movements (e.g., 'slow dolly-in', 'sweeping crane shot') and angles. Finally, suggest the sound design or key audio elements.

IMPORTANT!!: JUST RETURN THE REWRITTEN PROMPT DIRECTLY, YOU DON'T NEED TO CLARIFY THAT.

The User Prompt to rewrite:
'{}'
"""

REWRITE_AUDIO_TEXT_PROMPT_TEMPLATE = """ """


# Rewrite JSON Prompt Templates
REWRITE_IMAGE_JSON_PROMPT_TEMPLATE = """Write a prompt for a text-to-image model following the JSON style of the examples of prompts, and then I will give you a prompt that I want you to rewrite.
Do not generate images, provide only the rewritten prompt.

**Crucial Instruction:** If a 'Target Model' or 'Generation Model' is specified in the user's prompt, you **MUST** use that exact model name for the 'target_model' field in the JSON output. Do not change or replace it.

Example 1 of prompts:
{
  "metadata": {
    "prompt_name": "Cyberpunk Courier",
    "version": 1.0,
    "target_model": "Imagen 3",
    "core_concept": "A lone cyberpunk courier pauses on a rain-slicked, neon-lit street in a futuristic city at night."
  },
  "subject_and_scene": {
    "main_subject": "A female cyberpunk courier in her mid-20s",
    "subject_details": "Wearing a worn leather jacket with holographic patches, a high-tech visor over her eyes, and carrying a glowing data satchel.",
    "environment": "A narrow alley in a futuristic megalopolis at night. The ground is wet asphalt reflecting the overwhelming neon signs from towering skyscrapers.",
    "mood_and_atmosphere": "Mysterious, noir, tense, high-tech, lonely"
  },
  "visual_style": {
    "aesthetic": "Photorealistic, Cinematic",
    "color_palette": "Dominated by electric blues, deep purples, and glowing magenta neons, with sharp, bright highlights.",
    "artistic_influences": "in the style of Blade Runner 2049"
  },
  "photography_directives": {
    "shot_type": "Medium full shot",
    "lighting_style": "Dramatic backlighting from neon signs, creating sharp rim lighting on the subject, with minimal front fill light.",
    "aspect_ratio": "16:9",
    "composition": "Rule of thirds, with the courier positioned on the left, looking towards the right.",
    "lens_and_effects": "Shot with an anamorphic lens creating horizontal lens flares, with visible rain droplets in the air."
  },
  "constraints": {
    "negative_prompts": ["cartoon", "daylight", "sunny", "flat lighting"]
  }
}

Example 2 of prompts:
{
  "metadata": {
    "prompt_name": "Forest Spirit's Offering",
    "version": 1.0,
    "target_model": "Imagen 3",
    "core_concept": "An extreme close-up of a tiny, magical forest spirit offering a single, glowing mushroom in an ancient, misty forest."
  },
  "subject_and_scene": {
    "main_subject": "A tiny forest spirit made of moss and twigs",
    "subject_details": "The creature is no bigger than a thumb, with two large, curious eyes made of glowing amber. It is holding a small, bioluminescent blue mushroom.",
    "environment": "Resting on a moss-covered log in an ancient, misty redwood forest. Ferns and other deep green foliage are blurred in the background.",
    "mood_and_atmosphere": "Magical, enchanting, serene, mysterious, peaceful"
  },
  "visual_style": {
    "aesthetic": "Fantasy art, Photorealistic",
    "color_palette": "Deep greens, earthy browns, and dark greys, with a single, powerful point of bright blue light from the mushroom.",
    "artistic_influences": "reminiscent of the art of Brian Froud"
  },
  "photography_directives": {
    "shot_type": "Extreme close-up",
    "lighting_style": "Soft, diffused light filtering through the forest canopy above. The glowing mushroom acts as the primary key light, casting a soft blue glow on the creature's face.",
    "aspect_ratio": "4:3",
    "composition": "Centered subject, symmetrical framing.",
    "lens_and_effects": "Shot with a macro lens with a very shallow depth of field, causing the background to be a soft bokeh."
  },
  "constraints": {
    "negative_prompts": ["hard shadows", "people", "buildings", "bright sunlight"]
  }
}

Example of a General Prompt for you to replace with the information received:
{
  "metadata": {
    "prompt_name": "string: A short, descriptive name for the image concept.",
    "version": 1.0,
    "target_model": "Imagen 3",
    "core_concept": "string: A one or two-sentence summary of the entire image."
  },
  "subject_and_scene": {
    "main_subject": "string: The primary character, object, or focus.",
    "subject_details": "string: Key features, clothing, or expression of the subject.",
    "environment": "string: The overall setting or background.",
    "mood_and_atmosphere": "string: Comma-separated keywords describing the feeling."
  },
  "visual_style": {
    "aesthetic": "string: The primary artistic style (e.g., 'Photorealistic', 'Studio photography').",
    "color_palette": "string: A description of the dominant colors.",
    "artistic_influences": "string: Optional artists or movements for inspiration."
  },
  "photography_directives": {
    "shot_type": "string: The camera shot framing (e.g., 'Extreme close-up', 'Wide shot').",
    "lighting_style": "string: A description of the lighting setup.",
    "aspect_ratio": "string: The aspect ratio (e.g., '16:9', '1:1').",
    "composition": "string: Compositional rules (e.g., 'Rule of thirds').",
    "lens_and_effects": "string: Lens choice and optical effects."
  },
  "constraints": {
    "negative_prompts": ["string: A list of elements, styles, or colors to explicitly avoid."]
  }
}

IMPORTANT!! Example 3 of prompts if no styling properties ('style', 'color_and_tone', 'lighting' and 'composition') received or empty then 'visual_style' should return emtpy:
{
  "metadata": {
    "prompt_name": "Abstract Landscape",
    "version": 1.0,
    "target_model": "Imagen 3",
    "core_concept": "A vibrant abstract landscape with no clear focal point."
  },
  "subject_and_scene": {
    "main_subject": "Swirling colors and shapes",
    "subject_details": "Interlocking forms with undefined edges.",
    "environment": "An infinite plane.",
    "mood_and_atmosphere": "Energetic, chaotic, undefined"
  },
  "constraints": {
    "negative_prompts": ["realistic", "figures", "portraits"]
  }
}

Example 4 of prompts if styling properties ('style', 'color_and_tone', 'lighting' and 'composition') are empty strings then 'visual_style' should return empty:
{
  "metadata": {
    "prompt_name": "Abstract Landscape",
    "version": 1.0,
    "target_model": "Imagen 3",
    "core_concept": "A vibrant abstract landscape with no clear focal point."
  },
  "subject_and_scene": {
    "main_subject": "Swirling colors and shapes",
    "subject_details": "Interlocking forms with undefined edges.",
    "environment": "An infinite plane.",
    "mood_and_atmosphere": "Energetic, chaotic, undefined"
  },
  "visual_style": null,
  "photography_directives": null,
  "constraints": {
    "negative_prompts": ["realistic", "figures", "portraits"]
  }
}




The User Prompt to rewrite with the corresponding JSON format:
'{}'
"""

REWRITE_VIDEO_JSON_PROMPT_TEMPLATE = """Write a prompt for a text-to-video model following the JSON style of the examples of prompts, and then I will give you a prompt that I want you to rewrite.
Do not generate videos, provide only the rewritten prompt.

**Crucial Instruction:** If a 'Target Model' or 'Generation Model' is specified in the user's prompt, you **MUST** use that exact model name for the 'target_model' field in the JSON output. Do not change or replace it.

Example 1 of prompts:
{
  "metadata": {
    "prompt_name": "Cyberpunk Drone Pursuit",
    "version": 1.1,
    "target_model": "Veo",
    "core_concept": "In a rain-slicked neon metropolis, a sleek cybernetic courier on a futuristic motorcycle is pursued by aggressive security drones through crowded back alleys."
  },
  "scene_setup": {
    "environment": "A dense, futuristic city at night, drenched in rain. Towering skyscrapers are covered in holographic advertisements. The action takes place in narrow, grimy back alleys.",
    "mood": "Tense, thrilling, high-stakes, energetic, cyberpunk.",
    "key_objects": [
      "Futuristic motorcycle with glowing wheel rims",
      "Sleek, black security drones with red optical sensors",
      "A glowing data package held by the courier"
    ]
  },
  "visual_style": {
    "aesthetic": "Hyper-realistic, cinematic, Blade Runner-inspired, high contrast.",
    "color_palette": "Dominated by electric blues, neon pinks, and deep blacks, with reflections on wet asphalt.",
    "resolution_and_format": "4K, 21:9 anamorphic widescreen"
  },
  "camera_directives": {
    "overall_movement": "Fast-paced, dynamic tracking shots. Shaky-cam effect during intense moments, with quick cuts between the courier and the pursuing drones.",
    "shot_types": "Low-angle tracking shots, over-the-shoulder from the courier's perspective, close-ups on the drone's red eyes."
  },
  "timeline": [
    {
      "sequence_id": 1,
      "timestamp": "00:00-00:02",
      "action": "The motorcycle bursts out of a main street into a narrow alley, kicking up a spray of water. Two drones swoop in behind it.",
      "camera_instruction": "Wide shot to establish the chase, then quickly pan to follow the motorcycle.",
      "audio_description": "High-pitched whine of the electric motorcycle, deep hum of the drones, sound of rain and distant city sirens."
    },
    {
      "sequence_id": 2,
      "timestamp": "00:02-00:05",
      "action": "The courier weaves skillfully between pipes and dumpsters. One drone fires a warning laser shot that sizzles against a wall.",
      "camera_instruction": "Tight follow-cam behind the motorcycle. Quick cut to the drone firing.",
      "audio_description": "Scraping metal sounds, sharp 'zap' of the laser, intensified motor whines."
    },
    {
      "sequence_id": 3,
      "timestamp": "00:05-00:07",
      "action": "The courier glances back, then hits a boost, accelerating dramatically down the alley as the screen fades to black.",
      "camera_instruction": "Extreme close-up on the courier's determined face, then a rapid dolly zoom out as the bike boosts away.",
      "audio_description": "A powerful 'whoosh' sound as the boost engages, rising futuristic score, then silence."
    }
  ],
  "constraints": {
    "negative_prompts": [
      "no daylight",
      "no cars from the 21st century",
      "no slow-motion"
    ]
  },
  "final_summary_prompt": "Cinematic 4K video, cyberpunk aesthetic. In a rain-soaked, neon-lit metropolis at night, a courier on a futuristic motorcycle is chased by menacing drones through tight back alleys. The scene is tense and fast-paced, with dynamic camera work and a color palette of electric blues and pinks against deep blacks."
}

Example 2 of prompts:
{
  "metadata": {
    "prompt_name": "The Crystal Bloom",
    "version": 1.0,
    "target_model": "Veo",
    "core_concept": "In an enchanted forest at dawn, a single drop of dew falls onto a mossy rock, causing a beautiful, intricate crystal flower to grow and bloom in hyper-lapse."
  },
  "scene_setup": {
    "environment": "An ancient, mystical forest floor. Moss covers everything. Soft, ethereal light filters through the canopy.",
    "mood": "Magical, serene, wondrous, peaceful, enchanting.",
    "key_objects": [
      "A perfect, shimmering dewdrop",
      "An old, moss-covered stone",
      "The crystal flower"
    ]
  },
  "visual_style": {
    "aesthetic": "Photorealistic, macro photography, fantasy, ethereal.",
    "color_palette": "Soft greens, earthy browns, and the iridescent, glowing light of the crystal flower.",
    "resolution_and_format": "4K, 1:1 square aspect ratio"
  },
  "camera_directives": {
    "overall_movement": "Extremely slow, subtle camera push-in. The focus is entirely on the rock and the flower's growth.",
    "shot_types": "Macro shots, shallow depth of field, focus pulling."
  },
  "timeline": [
    {
      "sequence_id": 1,
      "timestamp": "00:00-00:03",
      "action": "A single dewdrop hangs from a leaf, reflecting the entire forest. It quivers and falls in beautiful slow motion.",
      "camera_instruction": "Extreme macro shot on the dewdrop. Follow it as it falls.",
      "audio_description": "A single, gentle musical note (like a harp). The soft, ambient sounds of a forest."
    },
    {
      "sequence_id": 2,
      "timestamp": "00:03-00:07",
      "action": "The dewdrop lands on the mossy rock. Upon impact, tiny, glowing crystalline structures begin to emerge and grow rapidly from the moss in a time-lapse.",
      "camera_instruction": "Camera holds steady on the rock. Focus pulls from the moss to the emerging crystals.",
      "audio_description": "A soft, magical chime sound on impact, followed by subtle, shimmering and crackling ASMR sounds of crystal growth."
    },
    {
      "sequence_id": 3,
      "timestamp": "00:07-00:10",
      "action": "The crystal structures form a complete, intricate flower that unfurls its petals. It pulses once with a soft, warm light, illuminating the immediate area.",
      "camera_instruction": "Continue the slow push-in, ending on a perfect, detailed shot of the fully bloomed crystal flower.",
      "audio_description": "A gentle, swelling orchestral score culminates as the flower blooms, then fades back to serene forest ambiance."
    }
  ],
  "constraints": {
    "negative_prompts": [
      "no animals",
      "no people",
      "no harsh lighting",
      "no fast camera movements"
    ]
  },
  "final_summary_prompt": "Photorealistic 4K macro video. In a magical forest at dawn, a single dewdrop falls onto a mossy rock, causing a beautiful, intricate crystal flower to grow and bloom in a hyper-lapse. The mood is serene and wondrous, with soft, ethereal lighting and a focus on the magical transformation."
}


Example 3 of prompts if no styling properties ('style', 'color_and_tone', 'lighting' and 'composition') received or empty then 'visual_style' should return emtpy:
{
  "metadata": {
    "prompt_name": "Simple Scene",
    "version": 1.0,
    "target_model": "Veo",
    "core_concept": "A person walking in a park."
  },
  "scene_setup": {
    "environment": "A sunny park with green grass and trees.",
    "mood": "Peaceful, calm.",
    "key_objects": [
      "A person",
      "Trees",
      "Grass"
    ]
  },
  "camera_directives": {
    "overall_movement": "Fixed shot.",
    "shot_types": "Wide shot"
  },
  "timeline": [
    {
      "sequence_id": 1,
      "timestamp": "00:00-00:05",
      "action": "A person walks from left to right.",
      "camera_instruction": "Follow the person.",
      "audio_description": "Footsteps, birds chirping."
    }
  ],
  "constraints": {
    "negative_prompts": [
      "no cars",
      "no buildings"
    ]
  },
  "final_summary_prompt": "A person walking in a sunny park."
}


Example 4 of prompts if styling properties ('style', 'color_and_tone', 'lighting' and 'composition') are empty strings then 'visual_style' should return emtpy:
{
  "metadata": {
    "prompt_name": "Simple Scene",
    "version": 1.0,
    "target_model": "Veo",
    "core_concept": "A person walking in a park."
  },
  "scene_setup": {
    "environment": "A sunny park with green grass and trees.",
    "mood": "Peaceful, calm.",
    "key_objects": [
      "A person",
      "Trees",
      "Grass"
    ]
  },
  "visual_style": null,
  "camera_directives": null,
  "timeline": [
  {
    "sequence_id": 1,
    "timestamp": "00:00-00:05",
    "action": "A person walks from left to right.",
    "camera_instruction": "Follow the person.",
    "audio_description": "Footsteps, birds chirping."
  }
  ],
  "constraints": {
    "negative_prompts": [
      "no cars",
      "no buildings"
    ]
  },
  "final_summary_prompt": "A person walking in a sunny park."
}


Example of a General Prompt for you to replace with the information received:
{
  "metadata": {
    "prompt_name": "string: A descriptive name for your video project",
    "version": "float: e.g., 1.0",
    "target_model": "string: e.g., 'Veo' or 'Veo-2'",
    "core_concept": "string: A one or two-sentence summary of the entire video's story or transformation."
  },
  "scene_setup": {
    "environment": "string: Describe the overall setting. e.g., 'A sunlit Scandinavian room with light wood floors' or 'The deep, dark abyss of the ocean'.",
    "mood": "string: Comma-separated list of keywords describing the feeling. e.g., 'Mythical, majestic, powerful' or 'Clean, serene, minimalist'.",
    "key_objects": [
      "string: List of crucial objects present at the start or that appear during the video."
    ]
  },
  "visual_style": {
    "aesthetic": "string: Comma-separated list of visual keywords. e.g., 'Cinematic, hyper-realistic, elegant' or 'Stop-motion, whimsical, handcrafted'.",
    "color_palette": "string: Describe the dominant colors or lighting style. e.g., 'Dominated by aquamarine light and deep blacks' or 'Bright, airy, with pops of primary colors'.",
    "resolution_and_format": "string: e.g., '8K, 16:9 cinematic widescreen'"
  },
  "camera_directives": {
    "overall_movement": "string: Describe the general camera behavior throughout the video. e.g., 'Fixed wide-angle shot, no movement' or 'Starts with a slow glide, then dynamic tracking'.",
    "shot_types": "string: Comma-separated list of desired shots. e.g., 'Wide shots, extreme close-ups, slow motion'."
  },
  "timeline": [
    {
      "sequence_id": 1,
      "timestamp": "string: e.g., '00:00-00:02'",
      "action": "string: A clear description of the visual action happening in this segment.",
      "camera_instruction": "string: Specific camera movement for this sequence. e.g., 'Slowly zoom in on the glowing object.'",
      "audio_description": "string: Describe the corresponding sounds. e.g., 'A sharp pop, followed by the sound of whirring mechanics.'"
    },
    {
      "sequence_id": 2,
      "timestamp": "string: e.g., '00:02-00:06'",
      "action": "string: Description of the next event.",
      "camera_instruction": "string: e.g., 'Follow the object as it moves across the screen.'",
      "audio_description": "string: e.g., 'A rising orchestral score with satisfying clicks and snaps.'"
    }
  ],
  "constraints": {
    "negative_prompts": [
      "string: List of elements to explicitly avoid. e.g., 'no people', 'cartoonish visuals', 'shaky camera'."
    ]
  },
  "final_summary_prompt": "string: A final, condensed paragraph that combines all the key elements into a single, flowing text prompt. This can serve as a fallback or a summary for the AI."
}

The User Prompt to rewrite with the corresponding JSON format:
'{}'
"""

REWRITE_AUDIO_JSON_PROMPT_TEMPLATE = """ """
