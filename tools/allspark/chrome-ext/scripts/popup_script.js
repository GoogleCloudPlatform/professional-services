const setDOMInfo = info => {
    document.getElementById('content').textContent = info;
};

// Once the DOM is ready...
window.addEventListener('DOMContentLoaded', (event) => {
    chrome.runtime.sendMessage({
        from: 'popup',
        subject: 'DOMInfo'
    }, setDOMInfo);
});

chrome.runtime.onMessage.addListener(async (request, sender) => {
    if ((request.from === 'background') && (request.subject === 'dataAgainCopied')) {
        await chrome.storage.local.get(["browserConent"], (data) => document.getElementById('content').textContent = data.browserConent);
    }
});