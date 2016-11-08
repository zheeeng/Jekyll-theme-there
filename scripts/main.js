window.onload = function () {
  (function initTopicPage () {
    var classContainer = 'j-overview-topic-container'
    var classHeading = 'j-overview-topic-heading'
    var classChangeAnchor = 'j-overview-topic-change'
    var __headingSelected = 'overview_topic-heading__selected'

    function switchTheme ($el, theme) {
      [].slice.call($el.classList).forEach(function (className) {
        if (/^theme\-/.test(className)) $el.classList.remove(className)
      })
      $el.classList.add('theme-' + theme)
    }

    function getClosestParentElementByClassName ($el, className) {
      while ($el) {
        if ($el.classList.contains(className)) {
          return $el
        } else {
          $el = $el.parentElement
        }
      }
      return null
    }

    var $topicContainers = document.getElementsByClassName(classContainer)
    if ($topicContainers) {
      [].forEach.call($topicContainers, function ($container) {
        [].forEach.call($container.getElementsByClassName(classChangeAnchor), function ($anchor) {
          $anchor.addEventListener('click', function (e) {
            e.preventDefault()
            switchTheme($container, $anchor.getAttribute('data-theme'))
            ;[].forEach.call($container.getElementsByClassName(classHeading), function ($heading) {
              $heading.classList.remove(__headingSelected)
            })
            getClosestParentElementByClassName($anchor, classHeading).classList.add(__headingSelected)
          })
        })
      })
    }
  })()
}
