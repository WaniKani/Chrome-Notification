// Copyright (c) 2015, Derek Guenther
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0


var availableReviews = document.getElementById('available-count');

var observer = new MutationObserver(function reviewSessionCallback() {
    if (availableReviews) {
        chrome.extension.sendMessage({reviews_available: parseInt(availableReviews.innerText, 10)});
    }
});

observer.observe(availableReviews, { childList: true, attributes: true, characterData: true, subtree: true });
