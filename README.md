# TimeCamp Tracker - Safari Extension
This is a migration of original [Chrome Extension] which basically integrates [TimeCamp] start/stop timer button on different online services like:

  - [ActiveCollab]
  - [Asana]
  - [Insightly]
  - [Pivotal Tracker]
  - [Podio]
  - [Teamwork]
  - [Trello]

It has been tested with both latest versions of Safari, but it should work on older versions too:

  - Safari 8.0.6 for Mac OSX 10.10.3 (Yosemite)
  - Safari 5.1.7 for Windows

## Steps for installation

1. Activate the integration of your desired service under your TimeCamp account. Different steps have to be followed there, depending on the service, but they are well documented.
2. Download & install Safari Extension:
  - production version: [http://labs.qdev.ro/safari/timecamp.safariextz][1]. I'm waiting Apple's approval for publishing it in [Safari Extension Library]
  - or you can fork, change and build your own package using the source code from this repository. You need to be subscribed on [Apple's Developer Program]
3. You should have an open session on your TimeCamp account under Safari
  - It's needed in order to automatically obtain your TimeCamp API token, at least once.
  - The token will be then storred in localStorage, and will be available from there until you clear your browser data for corresponding service.
  - This doesn't require an open window/tab on it, but to have a valid session cookie in Safari (not logged out or expired)
4. Done !
  - on task pages of your service (form the list above) the start/stop button has to be present, with ![TimeCamp logo icon][TimeCamp icon] green TimeCamp logo on it
  - you can use it to automatically track corresponding task time in your TimeCamp account

## Screenshots

![Trello](http://labs.qdev.ro/safari/timecamp/screenshots/03.png)
![ActiveCollab](http://labs.qdev.ro/safari/timecamp/screenshots/05.png)
![Insightly](http://labs.qdev.ro/safari/timecamp/screenshots/06.png)
![Pivotal Tracker](http://labs.qdev.ro/safari/timecamp/screenshots/09.png)
![TimeCamp Timesheet](http://labs.qdev.ro/safari/timecamp/screenshots/01.png)
![Safari for Windows](http://labs.qdev.ro/safari/timecamp/screenshots/11.png)

[1]: ttp://labs.qdev.ro/safari/timecamp.safariextz
[Chrome Extension]: https://chrome.google.com/webstore/detail/timecamp-timer/ohbkdjmhoegleofcohdjagmcnkimfdaa
[TimeCamp]: https://www.timecamp.com/
[ActiveCollab]: https://www.activecollab.com/
[Asana]: https://asana.com/
[Insightly]: https://www.insightly.com/
[Pivotal Tracker]: http://www.pivotaltracker.com/
[Podio]: https://podio.com/
[Teamwork]: https://www.teamwork.com/
[Trello]: https://trello.com/
[Apple's Developer Program]: https://developer.apple.com/programs/safari/
[Safari Extension Library]: https://extensions.apple.com/?category=productivity
[TimeCamp icon]: https://raw.githubusercontent.com/qdevro/timecamp.safariextz/master/images/icon-16.png
