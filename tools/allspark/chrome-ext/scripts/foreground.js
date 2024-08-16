document.addEventListener('keydown', (event) => {
    console.log(event.key);
    if(event.ctrlKey && event.key === 'w'){
        navigator.clipboard.readText()
            .then(res => {
                chrome.runtime.sendMessage({
                    message: 'search',
                    payload: `"${res}"`
                });
            })
            .catch(err => console.log(err));
    }

});