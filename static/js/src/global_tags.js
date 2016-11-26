'use strict';

function GlobalTags() {
    this.currentTag = {annotation:null,confidence:null};
    this.usingAnnotation = false;
    this.usingConfidence = false;
    this.globalTagView = new GlobalTagView();
    this.events = [];
    this.solution = '';
}

GlobalTags.prototype = {
    // Create the view dom and append event handlers
    create: function(){
        // Add events
        this.addGlobalEvents();

        //Create dom
        this.globalTagView.create();
    },

    // Attach event handler for global tag events
    addGlobalEvents: function() {
        $(this.globalTagView).on('global-tag-change', this.updateTag.bind(this));
        $(this.globalTagView).on('global-tag-change', this.updateSelectedTags.bind(this));

    },

    updateTag: function(event, data){
        var annotationEventType = null;
        var confidenceEventType = null;

        if (data.annotation && data.annotation !== this.currentTag.annotation) {
            annotationEventType = this.currentTag.annotation ? 'change' : 'new';
            this.currentTag.annotation = data.annotation;
        }
        if (data.confidence && data.confidence !== this.currentTag.confidence) {
            confidenceEventType = this.currentTag.confidence ? 'change' : 'new';
            this.currentTag.confidence = data.confidence;
        }

        // Feedback?

        // Track tag change / add events
        if (annotationEventType) {
            this.trackEvent(annotationEventType + '-global-annotation-label');
        }
        if (confidenceEventType) {
            this.trackEvent(confidenceEventType + '-global-confidence-label');
        }
    },

    updateSelectedTags: function(event, data) {

        if (data.annotation){
            $('.global_annotation_tag',this.globalTagView.dom).removeClass('selected');
            var selectedTags = $('.global_annotation_tag', this.globalTagView.dom).filter(function(){
                return this.innerHTML === data.annotation;
            });
            selectedTags.addClass('selected');
        }

        if (data.confidence){
            $('.global_confidence_tag',this.globalTagView.dom).removeClass('selected');
            var selectedTags = $('.global_confidence_tag', this.globalTagView.dom).filter(function(){
                return this.innerHTML === data.confidence;
            });
            selectedTags.addClass('selected');
        }
    },

    update: function(){
        var container = $('.global_stage_container');
        var content = this.globalTagView.dom;
        container.append(content);
    },

    // Reset the field values
    clear: function() {
        this.currentTag = {annotation:null,confidence:null};
        this.usingAnnotation = false;
        this.usingConfidence = false;
        this.events = [];
        this.solution = '';
    },

    // Reset field values and update tags
    reset: function(annotationTags, confidenceTags, solution) {
        this.clear();
        // Update tag contents
        this.updateContentsTags(annotationTags,confidenceTags);
        this.usingAnnotation = annotationTags.length > 0;
        this.usingConfidence = confidenceTags.length > 0;
        this.solution = solution || '';
    },

    updateContentsTags: function(annotationTags,confidenceTags) {
        this.globalTagView.updateTagContents(
            annotationTags,
            confidenceTags
        );
    },

    // Adds event tracking object to events list
    trackEvent: function(eventString) {
        var eventData = {
            event: eventString,
            time: new Date().getTime()
        };
        this.events.push(eventData);
    }
};

function GlobalTagView() {
    this.dom = null;
}

GlobalTagView.prototype = {
    // Create dom
    create: function() {
        var my = this;
        var container = $('<div>');

        var message = $('<div>', {
            class: 'global_tag_message',
        });

        var tagContainer = $('<div>', {
            class: 'global_tag_container',
        });

        this.dom = container.append([message,tagContainer]);
    },

    // Replace the annotation and confidence elements with the new elements
    // that contain the annotationTags and confidenceTags lists
    updateTagContents: function(annotationTags,confidenceTags) {
        $('.global_tag_container',this.dom).empty();
        var annotation = this.createAnnotationTags(annotationTags);
        var confidence = this.createConfidenceTags(confidenceTags);
        $('.global_tag_container',this.dom).append([annotation,confidence]);
    },

    // Create annotation tag elements
    createAnnotationTags: function(annotationTags) {
        if (annotationTags.length === 0){ return; }
        var my = this;

        var annotation = $('<div>');
        var annotationLabel = $('<div>', {
            class: 'global_annotation_label',
            text: 'Global Tag:',
        });

        var annotationContainer = $('<div>', {
            class: 'global_annotation_tags'
        });

        annotationTags.forEach(function (tagName) {
            var tag = $('<button>', {
                class: 'global_annotation_tag btn',
                text: tagName,
            });
            // When a tag is clicked, fire the 'global-tag-change' event with what tag it is
            tag.click(function() {
                $(my).trigger('global-tag-change', [{annotation:tagName}]);
            });
            annotationContainer.append(tag);
        });

        return annotation.append([annotationLabel, annotationContainer]);
    },

    createConfidenceTags: function(confidenceTags) {
        if (confidenceTags.length === 0){ return; }
        var my = this;

        var confidence = $('<div>');
        var confidenceLabel = $('<div>', {
            class: 'global_confidence_label',
            text: 'Confidence:',
        });

        var confidenceContainer = $('<div>', {
            class: 'global_confidence_tags'
        });

        confidenceTags.forEach(function (tagName) {
            var tag = $('<button>', {
                class: 'global_confidence_tag btn',
                text: tagName,
            });
            // When a tag is clicked, fire the 'global-tag-change' event with what tag it is
            tag.click(function() {
                $(my).trigger('global-tag-change', [{confidence:tagName}]);
            });
            confidenceContainer.append(tag);
        });

        return confidence.append([confidenceLabel, confidenceContainer]);
    },
};
