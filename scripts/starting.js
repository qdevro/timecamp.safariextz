// inject this only in parent document (not in Iframes too), and only on specific domains (services)
if (window === window.top && /((manageprojects|asana|pivotaltracker|podio|teamwork|trello)\.com|insight\.ly)/i.test(window.location.host)/* && /^\/(b|c)\//i.test(window.location.pathname)*/) {
  /***********************************************************
   * inject custom scripts & styles
   ***********************************************************/
  $(document).ready(function() {
    // Custom styles (if required)
    if (/((podio|teamwork|trello)\.com|insight\.ly)/i.test(window.location.host)) {
      var serviceStyle = document.createElement('link');
      
      serviceStyle.setAttribute('rel', 'stylesheet');
      serviceStyle.setAttribute('type', 'text/css');
      serviceStyle.setAttribute('href', safari.extension.baseURI + 'styles/service/' + domain.toLowerCase().replace(/(\.)(ly)$/i, '$2.css').replace(/\.com/i, '.css'));
      
      document.body.appendChild(serviceStyle);
    }
    
    // HTML5 History override to be notified on pushState
    var interceptor = document.createElement('script');
    
    interceptor.src = safari.extension.baseURI + 'scripts/interceptHistoryChanges.js';
    interceptor.type ='text/javascript';
    
    document.body.appendChild(interceptor);
  })
  
  /***********************************************************
   * HTML5 Notification API with permissions & alert fallback
   ***********************************************************/
  var notify = function(title, options, callbacks, sessionKey) {
    var me = this,
        arg = arguments;
    
    // check first if this is already shown or not in this session
    if (sessionKey && sessionStorage.getItem(sessionKey)) {
      return;
    }
    
    // check for notification compatibility
    if(!window.Notification || Notification.permission === 'denied') {
        // if browser version is unsupported, or denied --> use alert()
        alert(title + (options != 'undefined' && 'body' in options ? '\n\n' + options.body : ''));
        if (sessionKey != 'undefined'){
          sessionStorage.setItem(sessionKey, true);
        }
        return;
    }
    
    // if the user has not been asked to grant or deny notifications from this domain
    if(Notification.permission === 'default') {
        Notification.requestPermission(function() {
            // callback this function once a permission level has been set
            //notify(title, options, callbacks, sessionKey);
            notify.apply(me, arg);
        });
    }
    
    // if the user has granted permission for this domain to send notifications
    else if(Notification.permission === 'granted') {
        var n = new Notification(title, options);
        
        if (callbacks && typeof callbacks == 'object') {
          $.each(callbacks, function(key, value){
            n.addEventListener(key, value);
          })
        }
        
        if (sessionKey != 'undefined'){
          sessionStorage.setItem(sessionKey, true);
        }
    }
  };
  
  /***********************************************************
   * generate random GUID string
   ***********************************************************/
  var guid = function() {
    function s4() {
      return Math.floor((1 + Math.random()) * 0x10000)
        .toString(16)
        .substring(1);
    }
    return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
      s4() + '-' + s4() + s4() + s4();
  }
  
  /***********************************************************
   * extract correctly the domain name from URI
   ***********************************************************/
  var domain = (function(){
    var i=0,domain=document.domain,p=domain.split('.'),s='_gd'+(new Date()).getTime();
    while(i<(p.length-1) && document.cookie.indexOf(s+'='+s)==-1){
      domain = p.slice(-1-(++i)).join('.');
      document.cookie = s+"="+s+";domain="+domain+";";
    }
    
    document.cookie = s+"=;expires=Thu, 01 Jan 1970 00:00:01 GMT;domain="+domain+";";
    return domain;
  })();
}