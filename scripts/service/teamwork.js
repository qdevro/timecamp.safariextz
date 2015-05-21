function TeamworkTimer() {

    this.service = 'teamwork';
    this.messages.set('synchronizing', SYNCING);
    this.messages.set('buttonTimerStopTrackingAnotherTask', BUTTON_TIMER_STOPPED_SHORT);
    this.messages.set('buttonTimerStopped', BUTTON_TIMER_STOPPED_SHORT);
    this.messages.set('buttonTimerStarted', BUTTON_TIMER_STARTED_SHORT);
    this.infoInsertingInProgress = false;
    var $this = this;

    this.currentTaskId = function () {
        var url = document.URL;

        var MatchRes = /tasks\/([0-9]+)/g.exec(url);
        if (MatchRes) {
            var id = MatchRes[1];
            return id;
        } else {
            return null;
        }
    };

    this.isButtonInserted = function () {
        if (this.buttonInsertionInProgress)
            return true;

        if ($('#timecamp-track-button').length > 0)
            return true;

        return $('#Task').find('.titlecontent ul.options').length == 0;
    };

    this.insertButtonIntoPage = function () {
        this.buttonInsertionInProgress = true;
        console.log('Inserting button into page...');
        var currentTaskId = $this.currentTaskId();

        var parent = $('#Task').find('.titlecontent ul.options');


        var buttonObj = new TimerButton(currentTaskId);
        this.buttons[currentTaskId] = buttonObj;
        buttonObj.insertInProgress = true;

        var li = $('<li/>');
        var button = $('<button/>', { class:'btn btn-default', 'id': 'timecamp-track-button', 'data-taskId': currentTaskId });
        this.button = button;
        buttonObj.uiElement = button;

        li.append(button);
        parent.prepend(li);
        button.append($('<img id="tc-logo" src="' + safari.extension.baseURI + 'images/icon-14.png"/>'));
        button.append($('<span/>', { 'class': 'text' }).text(this.messages.synchronizing));
        button.append($('<span/>', { 'class': 'time' }).text("00:00").css({

        }).hide());


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
            var id = "#task"+this.trackedTaskId;
            var badges = $(id).find('.taskIcons');
            if (badges.find("#tc-badge").length == 0) {
                var badge = $("#tc-badge");

                if (badge.length > 0)
                    badge.detach();
                else
                    badge = $('<img/>',
                        {
                            id:         "tc-badge",
                            "class":    "badge",
                            style:      "vertical-align: top;",
                            src:        safari.extension.baseURI + 'images/icon-14.png',
                            title:      this.messages.badgeTimerRunning
                        });
                badges.prepend(badge);
            }
        }
        else
        {
            this.onSyncFailure();
        }
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
        return true;
    };

    this.insertInfoIntoPage = function () {
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
