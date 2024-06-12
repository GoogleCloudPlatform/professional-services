$(document).ready(function() {
    $("#submit").on("click", function(){
        chrome.identity.getAuthToken({interactive: true}, function(token) {
            executeCodeGen(token);
        });
    });
    $("#language").on("change", function(){
        updatePrompt();
    });
    $("#source").on("change", function(){
        updatePrompt();
    });
    $("#target").on("change", function(){
        updatePrompt();
    });

});

function updatePrompt(){
    var lang = $("#language").val();
    var src = $("#source").val();
    var target = $("#target").val();
    console.log("updatePrompt");

    if (lang === "Select dropdown" ||
        src === "Select dropdown" ||
        target === "Select dropdown")
        return false;

    var prompt = `convert below ${src} ${lang} code to ${target}`;
    $("#prompt").val(prompt);
}

function validateInput(){
    var content = $("#content").val();
    var prompt = $("#prompt").val();
    var valid = true;

    if (prompt === "") {
        $("#prompt").addClass("is-danger");
        valid = false;
    }
    else $("#prompt").removeClass("is-danger");

    if (content === "") {
        $("#content").addClass("is-danger");
        valid = false;
    }
    else $("#content").removeClass("is-danger");

    return valid;
}

function executeCodeGen(token){

    if (!validateInput()) return;
    disableSubmit();

    var content = $("#content").val();
    var prompt = $("#prompt").val();
    var API_ENDPOINT="us-central1-aiplatform.googleapis.com"
    var PROJECT_ID="REPLACE-YOUR-GCP-PROJECT-ID-HERE"
    var MODEL_ID="code-bison-32k"
    var LOCATION_ID="us-central1"
    var req = escape(prompt+" /n"+content);
    var requestData = {
                "instances": [
                    {"prefix": req }
                ],
                "parameters": {
                    "candidateCount": 1,
                    "maxOutputTokens": 8192,
                    "temperature": 0.1,
                    "topP": 1
                }
            };
    console.log(JSON.stringify(requestData));
    var genAIUrl = `https://${API_ENDPOINT}/v1/projects/${PROJECT_ID}/locations/${LOCATION_ID}/publishers/google/models/${MODEL_ID}:predict`

    $.ajax({
    type: "POST",
    url: genAIUrl,
    data: JSON.stringify(requestData),
    beforeSend: function(request) {
        request.setRequestHeader("Authorization", "Bearer "+token);
        request.setRequestHeader("Content-Type", "application/json");
      },
    success: function(data) {
      console.log('success: '+JSON.stringify(data));
      var converter = new showdown.Converter();

      $("#output").html(converter.makeHtml(data.predictions[0].content));
      enableSubmit();
    },
    });
}


function disableSubmit() {
    $("#submit").prop("disabled",true);
    $("#submit-wrapper").addClass("is-loading");
}

function enableSubmit() {
    $("#submit").prop("disabled",false);
    $("#submit-wrapper").removeClass("is-loading");
}