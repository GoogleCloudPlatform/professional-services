import time
from main import end_to_end_pipeline

start = time.time()
project_id = "sl-test-project-353312"
end_to_end_pipeline("gs://test-sl/hepasky-herbal-liver-tablets.pdf",
                    "test-sl", project_id)
end = time.time()
print(f"[INFO]: Pipeline runtime - {end-start} seconds")
