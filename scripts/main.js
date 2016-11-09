window.onload = function () {
  (function initTopicPage () {
    // For theme switching
    var classContainer = 'j-overview-topic-container'
    var classHeading = 'j-overview-topic-heading'
    var classChangeAnchor = 'j-overview-topic-change'
    var __headingSelected = 'overview_topic-heading__selected'
    // For navigation auto scrolling
    // Variable scrollReservZoneWidth define the width of the reserve zone on where the mousemove event not take effect. The reserve zone locate in the beginning and the end of the scroll mapping zone. The scrollSpeedFactor control the speed of scrolling
    var classNavScrollZone = 'j-overview-topic-nav'
    var scrollReserveZoneWidth = 40
    var scrollSpeedFactor = 0.2

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

    var $navs = document.getElementsByClassName(classNavScrollZone)
    if ($navs) {
      var bodyRect = document.body.getBoundingClientRect()
      ;[].forEach.call($navs, function ($nav) {
        var navRect = $nav.getBoundingClientRect()
        var navClientWidth = $nav.clientWidth
        var scrollFrameId
        // mouseOverX = the relative position X of mouse in $nav.clientWidth
        // mouseOverRateX = mouseOverX in percentage(exclude the reserve zone)
        var mouseOverX, mouseOverRateX
        // navScrollMaxDistance = $nav.scrollWdith - $nav.clientWidth in real time
        // navScrollLeft = $nav.scrollLeft in real time
        // navScrollLeftTo = map the variable mouseOverX in $nav.clientWidth (exclude the reserve zone, I employee the variable mouseOverRateX) to the distance X of navScrollMaxDistance in real time
        // navScrollLeftDistance = navScrollLeftTo - navScrollLeft
        var navScrollMaxDistance, navScrollLeft, navScrollLeftTo, navScrollLeftDistance

        $nav.addEventListener('mousemove', function (e) {
          mouseOverX = e.pageX - (navRect.left - bodyRect.left)
          mouseOverRateX = mouseOverX < scrollReserveZoneWidth ? 0
            : mouseOverX > navClientWidth - scrollReserveZoneWidth ? 1
            : (mouseOverX - scrollReserveZoneWidth) / (navClientWidth - scrollReserveZoneWidth * 2)
          cancelAnimationFrame(scrollFrameId)
          scrollFrameId = requestAnimationFrame(function loop () {
            if ($nav.scrollWidth <= navClientWidth) return
            navScrollMaxDistance = $nav.scrollWidth - navClientWidth
            navScrollLeft = $nav.scrollLeft
            navScrollLeftTo = navScrollMaxDistance * mouseOverRateX
            navScrollLeftDistance = navScrollLeftTo - navScrollLeft
            if (navScrollLeftDistance > 0) {
              // Positive distance means $nav need to scroll toward right
              if (navScrollLeftTo * scrollSpeedFactor < navScrollLeftDistance) {
                $nav.scrollLeft += navScrollLeftTo * scrollSpeedFactor
                scrollFrameId = requestAnimationFrame(loop)
              } else {
                $nav.scrollLeft += navScrollLeftDistance
              }
            } else if (navScrollLeftDistance < 0) {
              navScrollLeftDistance = -navScrollLeftDistance
              // Negative distance means $nav need to scroll toward left
              if ((navScrollMaxDistance - navScrollLeftTo) * scrollSpeedFactor < navScrollLeftDistance) {
                $nav.scrollLeft -= (navScrollMaxDistance - navScrollLeftTo) * scrollSpeedFactor
                scrollFrameId = requestAnimationFrame(loop)
              } else {
                $nav.scrollLeft -= navScrollLeftDistance
              }
            }
          })
        })
      })
    }
  })()
}
