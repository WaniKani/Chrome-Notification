// Copyright (c) 2012, Derek Guenther
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0

function checkForReviewCount(evt){
    if (document.getElementById("review-queue-count") !== undefined && 
        document.getElementById("review-queue-count").textContent == "0") {
        chrome.extension.sendMessage({reviews_available: 0});
    } 
}

// force an event listener for pageload since the count is delayed
window.addEventListener ("load", checkForReviewCount, false);
