chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (/^http/.test(tab.url) && changeInfo.status === 'complete') {
        chrome.scripting.executeScript({target: {tabId: tabId, allFrames: true}, files: ['./scripts/foreground.js'] }, () => {
            console.log('The foreground script has been injected.');
        });
    }
});
const isTabOpen =() => {
    chrome.tabs.query({}, async (tabs) => {
        var doFlag = true;
        for (const tab of tabs) {
            if (tab.url === `chrome-extension://${chrome.runtime.id}/popup.html`) {
                doFlag = false;
                chrome.runtime.sendMessage({
                    from: 'background',
                    subject: 'dataAgainCopied'
                });
                chrome.tabs.update(tab.id, {active: true});
                break;
            }
        }
        if (doFlag) {
            chrome.tabs.create(
                {
                    url: 'popup.html',
                }
            );
        }
    });
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.message === 'search') {
        chrome.storage.local.set({"browserConent": request.payload});
        isTabOpen();
    }
    if ((request.from === 'popup') && (request.subject === 'DOMInfo')) {
            chrome.storage.local.get(["browserConent"], function(data){
                sendResponse(data.browserConent);
            })
           return true;
    }
});

const copyPasteToAllSpark = (info,tab) => {
    chrome.storage.local.set({"browserConent": info.selectionText});
    isTabOpen();
}

chrome.contextMenus.create({
    id :'AllSpark',
    title: "Convert code with All Spark",
    contexts:["selection"]
});

chrome.contextMenus.onClicked.addListener(copyPasteToAllSpark);