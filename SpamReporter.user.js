// ==UserScript==
// @name         Spam Reporter
// @namespace    http://github.com/Tiny-Giant
// @version      1.0.0.0
// @description  Adds a link to the post menu for most posts. 
// @author       @TinyGiant
// @include      /^https?:\/\/\w*.?(stackexchange.com|stackoverflow.com|serverfault.com|superuser.com|askubuntu.com|stackapps.com|mathoverflow.net)\/q(uestions)?\/\d+/
// @grant        GM_xmlhttpRequest
// ==/UserScript==
/* jshint -W097 */

(function(){
    'use strict';

    var notify = (function(){
        var count = 0, timeout;
        return function(m,t) {
            console.log(m,t);
            if($('#notify-' + count).length) {
                clearTimeout(timeout);
                StackExchange.notify.close(count);
            }
            StackExchange.notify.show(m,++count);
            if(t) timeout = setTimeout(StackExchange.notify.close.bind(null,count), t);
        };
    })();
    
    var engage = function(scope) {

        if (!scope) {
            return false;
        }
        
        var room = 41570; // use 68414 for testing
        
        var postLink = scope.querySelector('.short-link').href;
        
        var reportSent = function(response) {
            console.log(response);
            
            if (response.status !== 200) {
                notify('Error sending request: ' + resp.responseText);
                return false;
            }
            
            notify('Close vote request sent.',1000);
        };
        
        var sendReport = function(response) {
            console.log(response);
            
            if (response.status !== 200) {
                notify('Failed sending report, check the console for more information.');
                return false;
            }
            
            var fkey = response.responseText.match(/hidden" value="([\dabcdef]{32})/)[1];
            
            if (!fkey) {
                notify('Failed retrieving key, is the room URL valid?');
                return false;
            }
            
            var reportStr = '!!/report ' + postLink;
            
            var options = {
                method: 'POST',
                url: 'http://chat.stackoverflow.com/chats/' + room + '/messages/new',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                data: 'text=' + encodeURIComponent(reportStr) + '&fkey=' + fkey,
                onload: reportSent
            };
            
            GM_xmlhttpRequest(options);
        };
        
        
        var report = function(e) {
            e.preventDefault();

            if(!confirm('Do you really want to report this post?')) {
                return false;
            }
            
            var options = {
                method: 'GET', 
                url: 'http://chat.stackoverflow.com/rooms/' + room, 
                onload: sendReport
            };
            
            GM_xmlhttpRequest(options);
        };

        var sep = document.createElement('span');
        sep.className = 'lsep';
        sep.textContent = '|';
        scope.appendChild(sep);
        
        var link = document.createElement('a');
        link.href = '#';
        link.textContent = 'report';
        link.addEventListener('click', report, false);
        scope.appendChild(link);
    };
    
    var menus = document.querySelectorAll('.post-menu');
    
    for(var i in Object.keys(menus)) engage(menus[i]);
    
    $(document).ajaxComplete(function(){
        var url = arguments[2].url;
        if (/^\/posts\/ajax-load-realtime\//.test(url)) engage(/\d+/.exec(url)[0]);
    });
})();
