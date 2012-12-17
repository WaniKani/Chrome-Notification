A Chrome extension that notifies you when you have more to study on WaniKani.com.

## License

Copyright (c) 2012, Derek Guenther.
All code is licensed under the [Apache License](http://www.apache.org/licenses/LICENSE-2.0), Version 2.0 (the "License"). You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0

## Features
* Updates a badge on the extension's icon when you have more to study
* Optionally displays a desktop notification as well
* Clicking on the badge redirects to WaniKani.com
* Settings sync with Chrome Sync, so all of your synced Chrome browsers will be set up automatically
* Memory efficient: Uses event pages to unload the extension when it's not busy

## Changelog

###HEAD

* Added a content script to monitor the WaniKani review page. Sets review count to 0 as soon as your review is complete.
* Added the option to display desktop notifications when you have new reviews. Defaults to off. Check the extension's options page.
* Added an option to change how frequently the extension updates review count when there are reviews due. Defaults to 1 minute. When reviews are due, the API returns "reviews_available" as approximately the current datetime. We could check "reviews_available_next_hour" every hour to see if there are new reviews and allow the content script to get rid of old reviews. However, if the user reviews in a different environment, the extension will be out of date for as long as an hour. For now, the review count syncs with the API every few minutes since it's not too intensive.

###v0.1.1

* Updated API calls to v1.1 (No impact on features)

###v0.1

* Initial release