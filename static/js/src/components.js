'use strict';

/*
 * Purpose:
 *   Used to create the timestamps of segment start and end times and play bar
 * Dependencies:
 *   jQuey, urban-ears.css
 */

var Util = {
    // Convert seconds to timestamp string
    secondsToString: function(seconds) {
        if (seconds === null) {
            return '';
        }
        var timeStr = '00:';
        if (seconds >= 10) {
            timeStr += seconds.toFixed(3);
        } else {
            timeStr += '0' + seconds.toFixed(3);
        }
        return timeStr;
    },

    // Return input elements that will contain the start, end and duration times of a sound segment
    createSegmentTime: function() {
        var timeDiv = $('<div>', {class: 'time_segment'});
        
        var start = $('<span>', {text: 'Start:'});
        var startInput = $('<input>', {
            type: 'text',
            class: 'form-control start',
            readonly: true
        });
        var end = $('<span>', {text: 'End:'});
        var endInput = $('<input>', {
            type: 'text',
            class: 'form-control end',
            readonly: true
        });

        var duration = $('<span>', {text: 'Duration:'});
        var durationInput = $('<input>', {
            type: 'text',
            class: 'form-control duration',
            readonly: true
        });

        // Return the parent element with the all the time elements appended 
        return timeDiv.append([start, startInput, end, endInput, duration, durationInput]);
    }
};

/*
 * Purpose:
 *   Used for the play button and timestamp that controls how the wavesurfer audio is played
 * Dependencies:
 *   jQuery, Font Awesome, Wavesurfer (lib/wavesurfer.min.js), Util (src/components.js), urban-ears.css
 */

function PlayBar(wavesurfer) {
    this.wavesurfer = wavesurfer;
    // Dom element containing play button and progress timestamp
    this.playBarDom = null;
    // List of user actions (click-pause, click-play, spacebar-pause, spacebar-play) with
    // timestamps of when the user took the action
    this.events = [];
}

PlayBar.prototype = {

    // Return a string of the form "<current_time> / <clip_duration>" (Ex "00:03.644 / 00:10.796")
    getTimerText: function() {
        return Util.secondsToString(this.wavesurfer.getCurrentTime()) +
               ' / ' + Util.secondsToString(this.wavesurfer.getDuration());
    },

    // Create the play bar and progress timestamp html elements and append eventhandlers for updating
    // these elements for when the clip is played and paused
    create: function() {
        var my = this;
        this.addWaveSurferEvents();

        // Create the play button
        var playButton = $('<i>', {
            class: 'play_audio fa fa-play-circle',
        });
        playButton.click(function () {
            my.trackEvent('click-' + (my.wavesurfer.isPlaying() ? 'pause' : 'play'));
            my.wavesurfer.playPause();
        });
        
        // Create audio timer text
        var timer = $('<span>', {
            class: 'timer',
        });    

        this.playBarDom = [playButton, timer];
    },

    // Append the play buttom and the progress timestamp to the .play_bar container
    update: function() {
        $(this.playBarDom).detach();
        $('.play_bar').append(this.playBarDom);
        this.events = [];
        this.updateTimer();
    },

    // Update the progress timestamp (called when audio is playing)
    updateTimer: function() {
        $('.timer').text(this.getTimerText());
    },

    // Used to track events related to playing and pausing the clip (click or spacebar)
    trackEvent: function(eventString) {
        var eventData = {
            event: eventString,
            time: new Date().getTime()
        };
        this.events.push(eventData);
    },

    // Return the list of events representing the actions the user did related to playing and
    // pausing the audio
    getEvents: function() {
        // Return shallow copy
        return this.events.slice();
    },

    // Add wavesurfer event handlers to update the play button and progress timestamp
    addWaveSurferEvents: function() {
        var my = this;

        this.wavesurfer.on('play', function () {
            $('.play_audio').removeClass('fa-play-circle').addClass('fa-stop-circle');
        });
        
        this.wavesurfer.on('pause', function () {
            $('.play_audio').removeClass('fa-stop-circle').addClass('fa-play-circle');
        }); 

        this.wavesurfer.on('seek', function () {
            my.updateTimer();
        });

        this.wavesurfer.on('audioprocess', function () {
            my.updateTimer();
        });

        // Play and pause on spacebar keydown
        $(document).on("keydown", function (event) {
            if (event.keyCode === 32) {
                event.preventDefault();
                my.trackEvent('spacebar-' + (my.wavesurfer.isPlaying() ? 'pause' : 'play'));
                my.wavesurfer.playPause();
            }
        });
    },
};

/*
 * Purpose:
 *   Used for the workflow buttons that are used to submit annotations or to exit the task
 * Dependencies:
 *   jQuery, urban-ears.css
 */

function WorkflowBtns(exitUrl) {
    // Dom of submit and load next btn
    this.nextBtn = null;
    // Dom of exit task btn
    this.exitBtn = null;
    // The url the user will be directed to when they exit
    this.exitUrl = exitUrl;

    // Boolean that determined if the exit button is shown
    this.showExitBtn = false;
}

WorkflowBtns.prototype = {
    // Create dom elements for the next and exit btns
    create: function() {
        var my = this;
        this.nextBtn = $('<button>', {
            class: 'btn submit',
            text: 'SUMBIT & LOAD NEXT CLIP'
        });
        this.nextBtn.click(function () {
            $(my).trigger('submit-annotations');
        });

        this.exitBtn = $('<button>', {
            text: 'Exit Now',
            class: 'exit btn',
        });
        this.exitBtn.click(function () {
            window.location = my.exitUrl;
        });
    },

    // Append the next and exit elements to the the parent container
    update: function() {
        $('.submit_container').append(this.nextBtn);
        if (this.showExitBtn) {
            $('.submit_container').append(this.exitBtn);
        }
    },

    // Set the value of showExitBtn
    setExitBtnFlag: function(showExitBtn) {
        this.showExitBtn = showExitBtn;
    }
};

/*
 * Purpose:
 *   Used to zoom in and out as well as update the timeline.
 * Dependencies:
 *   jQuery, Font Awesome, Wavesurfer (lib/wavesurfer.min.js), urban-ears.css
 */
 function ZoomBar(wavesurfer) {
    this.wavesurfer = wavesurfer;
    // Dom element containing zoom elements
    this.zoomDom = null;
    // List of user actions (zoom-in, zoom-out) with timestamps of when the user took the action
    this.events = [];
 }

 ZoomBar.prototype = {
    
    // Creates the Zoom buttons and appends eventhandlers for updating
    // these elements.
    create: function() {
        var my= this;
        //this.addWaveSurferEvents();

        // Create the Zoom IN button
        var zoomIn = $('<i>', {
            class: 'zoom_button fa fa-search-plus',
        });
        zoomIn.click(function() {
            var zoomLevel = my.wavesurfer.params.minPxPerSec;
            my.trackEvent('click-' + 'zoom-in');
            if (zoomLevel + 100 <= 900){
                my.wavesurfer.zoom(my.wavesurfer.params.minPxPerSec + 100);
            }
        });

        // Create the Zoom OUT button
        var zoomOut = $('<i>', {
            class: 'zoom_button fa fa-search-minus',
            style: 'padding-right:1%'
        });
        zoomOut.click(function() {
            var zoomLevel = my.wavesurfer.params.minPxPerSec;
            my.trackEvent('click-' + 'zoom-out');
            if (zoomLevel - 100 >= 0){
                my.wavesurfer.zoom(my.wavesurfer.params.minPxPerSec - 100);
            }
        });

        this.zoomDom = [zoomOut,zoomIn];
    },

    // Append the zoom buttons to the .zoom_bar container
    update: function() {
        $(this.zoomDom).detach();
        $('.zoom_bar').append(this.zoomDom);
        this.events = [];
    },

    // Used to track events related to zooming in and out
    trackEvent:function(eventString) {
        var eventData = {
            event: eventString,
            time: new Date().getTime()
        };
        this.events.push(eventData);
    },

    // Return the list of events representing the actions the user did related to playing and
    // pausing the audio
    getEvents: function() {
        // Return shallow copy
        return this.events.slice();
    },
 };


/*
 * Purpose:
 *   Used to change the amplitude of certain frequencies for better listening.
 * Dependencies:
 *   jQuery, Font Awesome, Wavesurfer (lib/wavesurfer.min.js), urban-ears.css
 */
 function Equalizer(wavesurfer) {
    this.wavesurfer = wavesurfer;
    // Dom element containing zoom elements
    this.eqDom = [];
    // List of user actions (changing freqs) with timestamps of when the user took the action
    this.events = [];
    // EQ Values
    this.EQ = [
        {
          f: 32,
          type: 'lowshelf'
        },
        {
          f: 64,
          type: 'peaking'
        },
        {
          f: 125,
          type: 'peaking'
        },
        {
          f: 250,
          type: 'peaking'
        },
        {
          f: 500,
          type: 'peaking'
        },
        {
          f: 1000,
          type: 'peaking'
        },
        {
          f: 2000,
          type: 'peaking'
        },
        {
          f: 4000,
          type: 'peaking'
        },
        {
          f: 8000,
          type: 'peaking'
        },
        {
          f: 16000,
          type: 'highshelf'
        }
    ];
 }

 Equalizer.prototype = {
    
    // Creates the filters, vertical range sliders,
    // connects filters to wavesurfer and appends 
    // eventhandlers for updating these elements.
    create: function() {
        var my= this;

        // Create filters
        var filters = this.EQ.map(function (band) {
            var filter = my.wavesurfer.backend.ac.createBiquadFilter();
            filter.type = band.type;
            filter.gain.value = 0;
            filter.Q.value = 1;
            filter.frequency.value = band.f;
            return filter;
        });

        // Connect filters to wavesurfer
        my.wavesurfer.backend.setFilters(filters);

        // Bind filters to vertical range sliders
        var container = document.querySelector('.equalizer');
        filters.forEach(function (filter) {
            var input = document.createElement('input');
            my.wavesurfer.util.extend(input, {
                type: 'range',
                min: -40,
                max: 40,
                value: 0,
                title: filter.frequency.value
            });
            input.style.display = 'inline-block';
            input.setAttribute('orient','vertical');
            my.wavesurfer.drawer.style(input, {
                width: '35px',
                height: '150px'
            });
            container.appendChild(input);

            var onChange = function(e) {
                filter.gain.value = ~~e.target.value;
                //$("span[class^='thumb']").remove()
            };

            input.addEventListener('input',onChange);
            input.addEventListener('change',onChange);
        });

    },

    // Append the zoom buttons to the .zoom_bar container
    update: function() {
        $(this.eqDom).detach();
        $('.zoom_bar').append(this.zoomDom);
        this.events = [];
    },

    // Used to track events related to zooming in and out
    trackEvent:function(eventString) {
        var eventData = {
            event: eventString,
            time: new Date().getTime()
        };
        this.events.push(eventData);
    },

    // Return the list of events representing the actions the user did related to playing and
    // pausing the audio
    getEvents: function() {
        // Return shallow copy
        return this.events.slice();
    },
 };