var TrelloTimer = function() {
  this.service = 'trello';
  var $this = this;
  
  this.isWatching = $this.canWatch.HISTORY;

  this.messages.set('buttonTimerStopped', BUTTON_TIMER_STOPPED_SHORT);
  this.messages.set('buttonTimerStarted', BUTTON_TIMER_STARTED_SHORT);
  this.messages.set('synchronizing', SYNCING);
  this.messages.set('buttonTimerStopping', BUTTON_TIMER_STOPPING_SHORT);


  this.currentTaskId = function () {
      var url = document.URL;
      var MatchRes = url.match(/\/c\/([a-zA-Z0-9]*)/);
      if (MatchRes) {
          var id = MatchRes[1];
          return id;
      } else {
          return null;
      }
  };

  this.onSyncSuccess = function (response) {
      if (this.isTimerRunning) {
          this.trackedTaskId = response.external_task_id;
          if (!this.trackedTaskId)
              return;
          var badges = $('.list-cards a[href^="/c/' + this.trackedTaskId + '"]').siblings('div.badges');
          if (badges.find("#tc-badge").length == 0) {
              var badge = $("#tc-badge");

              if (badge.length > 0)
                  badge.detach();
              else
                  badge = $('<img/>',
                      {
                          id:         "tc-badge",
                          class:      "badge",
                          src:        safari.extension.baseURI + 'images/icon-14.png',
                          title:      this.messages.badgeTimerRunning
                      });
              badges.append(badge);
          }
      }
      else
      {
          this.onSyncFailure();
      }
  };

  this.onSyncFailure = function () {
      var badge = $("#tc-badge");
      if (badge.length > 0)
          badge.remove();
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

      if (duration > 0) {
          timecampTrackInfo.text('(You spent ' + $this.getElapsedTime(duration) + ' doing this task)');
      }
      else
      {
          timecampTrackInfo.text('');
      }
  };

  this.isButtonInserted = function () {
      if (this.buttonInsertionInProgress)
          return true;

      if ($('#timecamp-track-button').length > 0)
          return true;

      return $('.window .window-main-col').length == 0;
  };

  this.isInfoInserted = function () {
      if (this.infoInsertingInProgress)
          return true;

      if ($('#timecamp-track-info').length > 0)
          return true;

      if ($('.window-header-inline-content.js-current-list').length == 0)
          return true;

      return false;
  };

  this.insertInfoIntoPage = function () {
      var taskId = $this.currentTaskId();
      if (!taskId)
          return;
      //console.log('Inserting Info into page...');
      this.infoInsertingInProgress = true;

      $.when($this.getTrackedTime())
          .then(function (sum) {
              $this.taskDuration[taskId] = sum;
              $this.updateTopMessage();
          });

      var infoTop = $('.quiet.hide-on-edit.window-header-inline-content.js-current-list');
      var info = $('<span/>', { 'id': 'timecamp-track-info' });
      infoTop.append(info);
      this.infoInsertingInProgress = false;
  };

  this.insertButtonIntoPage = function () {
    //console.log('Inserting button into page: ' + $this.currentTaskId() + ' on page ' + document.URL);
      if (!$this.currentTaskId())
        return;

      var buttonObj = new TimerButton($this.currentTaskId());
      this.buttons[$this.currentTaskId()] = buttonObj;
      buttonObj.insertInProgress = true;

      this.buttonInsertionInProgress = true;
      var button = $('<a/>', { 'class': 'button-link', 'id': 'timecamp-track-button', 'status': 'unknown' });

      buttonObj.uiElement = button;
      this.button = button;
      button.append($('<img id="tc-logo" src="' + safari.extension.baseURI + 'images/icon-16.png' + '" />'));
      button.append($('<span/>', { 'class': 'text' }).text(this.messages.synchronizing));
      button.append($('<span/>', { 'class': 'time' }).text("00:00").hide());


      $.when(this.updateButtonState())
          .always(function () {
              $this.buttonInsertionInProgress = false;
          });


      button.click(function () {
          $this.buttonClick($this.currentTaskId());
      });
      var buttonList = $('.window-module.other-actions.u-clearfix .u-clearfix');
      buttonList.prepend(button);
      $('<hr />').insertBefore('.js-move-card');
      buttonObj.insertInProgress = false;
  };

  this.getParentId = function()
  {
      var a = $(".js-recent-boards").find('.sidebar-boards-list').find('a:first');
      var href = a.prop('href');
      if (href == this.lastData)
          return this.lastParentId;

      var pattern = /\/b\/([a-zA-z0-9]+)\//;
      var res = pattern.exec(href);

      if (res && res.length > 1)
      {
          this.lastData = href;
          this.lastParentId = res[1];
          return res[1];
      }

      return null;
  };

  this.onTrackingDisabled = function() {
      var button = this.buttons[this.currentTaskId()];
      if (!button || button.denied)
          return;

      var link = $('<a/>', {
          class:'quiet-button',
          text:'Integration settings',
          href:'https://www.timecamp.com/addons/trello/index/'+this.lastParentId,
          title:'Synchronize this board to start tracking time.',
          target:'_blank'}
      );

      var p = $('<p/>', {class: 'quiet bottom', id:'tc-integration-link'});

      p.append(link);
      button.denied = true;
      button.uiElement.off('click')
          .addClass('disabled')
          .attr('title','Current settings of the integration don\'t allow time tracking for this tasks. Please use link below to review and change the settings of the integration')
          .after(p);

      $("#timecamp-track-info").hide();
      $("#tc-logo").css({'opacity': '0.7', '-webkit-filter':'saturate(0%)'});
  };

  this.bindEvents(this);
}

TrelloTimer.prototype = new TimerBase();
timer = new TrelloTimer();