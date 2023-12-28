chrome.runtime.onInstalled.addListener(() => {
  console.log('Extension installed');
});

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  if (request.action === "getConfig") {
      chrome.storage.sync.get({ pageCount: '5', showLabelPage: true, showLabelPost: true }, function(data) {
          sendResponse({ pageCount: data.pageCount, showLabelPage: data.showLabelPage, showLabelPost: data.showLabelPost });
      });
      return true; // Indica que la respuesta se enviará de forma asíncrona
  }
});