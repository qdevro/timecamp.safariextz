function TeamworkTimer() {

    this.service = 'insightly';
    this.messages.set('synchronizing', SYNCING);
    this.messages.set('buttonTimerStopTrackingAnotherTask', BUTTON_TIMER_STOPPED_SHORT);
    this.messages.set('buttonTimerStopped', BUTTON_TIMER_STOPPED_SHORT);
    this.messages.set('buttonTimerStarted', BUTTON_TIMER_STARTED_SHORT);
    this.infoInsertingInProgress = false;
    this.isWatching = this.canWatch.DOM;
    var $this = this;

    this.currentTaskId = function () {
        var url = document.URL;

        var tasksPattern = /Tasks\/TaskDetails\/([0-9]+)/ig;
        var projectsPattern = /Projects\/Details\/([0-9]+)/ig;
        var opportunitiesPattern = /opportunities\/details\/([0-9]+)/ig;

        MatchRes = tasksPattern.exec(url);
        if (MatchRes)
            return MatchRes[1];

        MatchRes = projectsPattern.exec(url);
        if (MatchRes)
            return "project_"+MatchRes[1];

        MatchRes = opportunitiesPattern.exec(url);
        if (MatchRes)
            return "opp_"+MatchRes[1];

        return null;
    };

    this.isButtonInserted = function () {
        if (!this.currentTaskId())
            return true;

        if (this.buttonInsertionInProgress)
            return true;

        if ($('#timecamp-track-button').length > 0)
            return true;

        return $('#content').find('[class^="header-toolbar"] .btn-toolbar').length == 0;
    };

    this.insertButtonIntoPage = function () {
        this.buttonInsertionInProgress = true;
        console.log('Inserting button into page...');
        var currentTaskId = $this.currentTaskId();
        console.log('currentTaskId', currentTaskId);
        if (!currentTaskId)
        {
            this.buttonInsertionInProgress = false;
            return;
        }

        var parent = $('#content').find('[class^="header-toolbar"] .btn-toolbar');
        var buttonObj = new TimerButton(currentTaskId);

        this.buttons[currentTaskId] = buttonObj;
        buttonObj.insertInProgress = true;

        var containter = $('<div/>',{class:'btn-group'});
        var button = $('<button/>', { class:'btn btn-default', 'id': 'timecamp-track-button', 'data-taskId': currentTaskId });
        button.append($('<img id="tc-logo" src="' + safari.extension.baseURI + 'images/icon-14.png"/>'));
        button.append($('<span/>', { 'class': 'text' }).text(this.messages.synchronizing));
        button.append($('<span/>', { 'class': 'time' }).text("00:00").css({}).hide());

        this.button = button;
        buttonObj.uiElement = button;

        containter.append(button);
        containter.insertBefore(parent.find('.btn-group.pull-right').eq(0));

        button.click(function () {
            $this.buttonClick($this.currentTaskId(), null, function () { $this.button.children('.time').hide() });
        });

        buttonObj.insertInProgress = false;

        $.when(this.updateButtonState()).always(function () {
            $this.buttonInsertionInProgress = false;
        });
    };

    this.onSyncSuccess = function (response) {
        if (this.isTimerRunning) {
            this.trackedTaskId = response.external_task_id;
            if (!this.trackedTaskId)
                return;


            var badges;

            var replaces = ["opp_","project_"];
            var replacement = null;
            var task_id;
            for (var i = 0; i < replaces.length; i++)
            {
                var replace = replaces[i];
                task_id = this.trackedTaskId.replace(replace,'');
                if (task_id != this.trackedTaskId)
                {
                    replacement = replace;
                    break;
                }
            }

            switch (replacement)
            {
                case 'opp_':
                    badges = $("#opportunity-list").find(".link-box [href='/opportunities/details/"+task_id+"']");
                    break;
                case 'project_':
                    badges = $("#project-list").find(".link-box [href='/Projects/Details/"+task_id+"']");
                    break;
                default:
                    badges = $("#taskList").find(".subject [href='/Tasks/TaskDetails/"+task_id+"']");
                    break;
            }

            if (badges.find("#tc-badge").length == 0) {
                var badge = $("#tc-badge");

                if (badge.length > 0)
                    badge.detach();
                else
                    badge = $('<img/>',
                        {
                            id:         "tc-badge",
                            style:      "margin-top: -2px;",
                            src:        safari.extension.baseURI + 'images/icon-14.png',
                            title:      this.messages.badgeTimerRunning
                        });
                badges.parent().append(badge);
            }
        }
        else
        {
            this.onSyncFailure();
        }
    };

    this.getEntriesStartTime = function () {
        return '2014-07-01';
    };

    this.updateTopMessage = function () {
        var timecampTrackInfo = $('#timecamp-track-info');
        var taskDuration = $this.taskDuration[$this.currentTaskId()];
        if (!taskDuration)
            taskDuration = 0;

        var duration = 0;
        if ($this.startDate && $this.trackedTaskId == $this.currentTaskId())
            duration = moment().diff($this.startDate, 'seconds');

        duration += taskDuration;

        if (duration == 0)
            timecampTrackInfo.html('');
        else
            timecampTrackInfo.html('<b>You</b> spent ' + $this.getElapsedTime(duration) + ' doing this task');
    };

    this.isInfoInserted = function () {
        if (!this.currentTaskId())
            return true;


        if (this.infoInsertingInProgress)
            return true;

        if ($('#timecamp-track-info').length > 0)
            return true;

        if ($(".entity-detail").find(".property-table").length == 0)
            return true;

        return false;
    };

    this.updateTopMessage = function () {
        var currentTaskId = $this.currentTaskId();
        if (!currentTaskId)
            return;

        var timecampTrackInfo = $('#timecamp-track-info');

        var taskDuration = $this.taskDuration[currentTaskId];
        if (!taskDuration)
            taskDuration = 0;

        var taskDurationToday = $this.taskDurationToday[currentTaskId];
        if (!taskDurationToday)
            taskDurationToday = 0;

        var duration = 0;

        if ($this.startDate && $this.trackedTaskId == currentTaskId)
            duration = moment().diff($this.startDate, 'seconds');

        var durationToday = duration + taskDurationToday;
        duration += taskDuration;

        if (duration == 0)
            timecampTrackInfo.html('No time tracked yet');
        else
            timecampTrackInfo.html('<b>You</b> spent ' + $this.getElapsedTime(duration) + ' doing this task ('+$this.getElapsedTime(durationToday)+ ' today)');
    };

    this.insertInfoIntoPage = function () {
        var taskId = $this.currentTaskId();
        if (!taskId)
            return;

        this.infoInsertingInProgress = true;
        console.log('Inserting info...');

        if (this.taskDuration[taskId] === undefined)
        {
            this.taskDuration[taskId] = 0;
            this.taskDurationToday[taskId] = 0;
            $.when($this.getTrackedTime())
                .then(function (sum, sumToday) {
                    $this.taskDuration[taskId] = sum;
                    $this.taskDurationToday[taskId] = sumToday;
                    $this.updateTopMessage();
                });
        }
        else
            $this.updateTopMessage();

        var container = $(".entity-detail").find(".property-table");

        var tr = $('<tr/>');
        var tdTitle = $('<td/>', {class:'ralign'});
        var tdValue = $('<td/>');
        var title = $('<span />', {class: 'title', html:'TimeCamp'});
        var value = $('<div/>', { 'class': 'info', 'id': 'timecamp-track-info', 'text' : 'No data yet'});

        tdTitle.append(title);
        tdValue.append(value);
        tr.append(tdTitle);
        tr.append(tdValue);
        container.prepend(tr);

        this.infoInsertingInProgress = false;
    };

    this.onSyncFailure = function () {
        var badge = $("#tc-badge");
        if (badge.length > 0)
            badge.remove();
    };

    this.getParentId = function() {
        var overview = $('#tab_overview');
        if (!overview.length)
            return null;

        var link = overview.children('a:first').attr('href');
        if (link == '' || link === undefined)
            return null;
        if (link == this.lastData)
            return this.lastParentId;

        var id = /projects\/([0-9]+)+-.*\/overview/.exec(link);

        if (id.length < 2)
            return null;

        this.lastData = link;
        this.lastParentId = id[1];
        return id[1];
    };

    this.onTrackingDisabled = function() {
        var button = this.buttons[this.currentTaskId()];
        if (!button || button.denied)
            return;

        var notice = $('<div/>', {'class': 'teamwork-settings-notice',
            'html':'Current settings of the integration in TimeCamp don\'t allow time tracking for this tasks. <a href="https://www.timecamp.com/addons/teamwork/index/'+this.lastParentId+'" target="_blank">Synchronize this project</a> to start tracking time.'});

        button.denied = true;
        button.uiElement.off('click').children().css({'opacity': '0.6'});
        $("#tc-logo").css({'-webkit-filter':'saturate(0%)'});
        $('#TaskContent').find('.taskList').before(notice);
    };

    this.bindEvents(this);
}
TeamworkTimer.prototype = new TimerBase();
timer = new TeamworkTimer();