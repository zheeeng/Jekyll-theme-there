window.onload = function () {
  // Shims to be fulfilled
  var shims = {
    forEach: null,
    filter: null,
    addEvent: null,
    loopEventByFrame: null,
    cancelLoopEventByFrame: null
  }

  ;(function (shims) {
    shims.forEach = (function () {
      if (Array.prototype.forEach) {
        return function (arrayLikeList, callback, thisArg) {
          return Array.prototype.forEach.call(arrayLikeList, callback, thisArg)
        }
      } else {
        return function (arrayLikeList, callback, thisArg) {
          if (arrayLikeList === null || arrayLikeList === void 0) throw new TypeError('parameter arrayLikeList is null or undefined')
          if (typeof callback !== 'function') throw new TypeError('parameter callback is not a function')
          var o = Object(arrayLikeList)
          var len = o.length >>> 0
          var k = 0
          while (k < len) {
            if (k in o) callback.call(thisArg, o[k], k, o)
            k++
          }
          return void 0
        }
      }
    })()
  })(shims)

  ;(function (shims) {
    shims.filter = (function () {
      if (Array.prototype.filter) {
        return function (arrayLikeList, filter, thisArg) {
          return Array.prototype.filter.call(arrayLikeList, filter, thisArg)
        }
      } else {
        return function (arrayLikeList, filter, thisArg) {
          if (arrayLikeList === null || arrayLikeList === void 0) throw new TypeError('parameter arrayLikeList is null or undefined')
          if (typeof filter !== 'function') throw new TypeError('parameter filter is not a function')
          var o = Object(arrayLikeList)
          var len = o.length >>> 0
          var res = []
          var k = 0
          while (k < len) {
            if (k in o && filter.call(thisArg, o[k], k, o)) res.push(o[k])
            k++
          }
          return res
        }
      }
    })()
  })(shims)

  ;(function (shims) {
    shims.addEvent = (function () {
      if (window.addEventListener) {
        return function ($el, type, callback) {
          $el.addEventListener(type, callback, false)
        }
      } else if (window.attachEvent) {
        return function ($el, type, callback) {
          $el.attachEvent('on' + type, callback)
        }
      }
    })()
  })(shims)

  ;(function (shims) {
    // Reference: https://gist.github.com/paulirish/1579671
    // MIT license
    var lastTime = 0
    var vendors = ['ms', 'moz', 'webkit', 'o']
    var loop = window.requestAnimationFrame
    var cancel = window.cancelAnimationFrame

    for (var x = 0; x < vendors.length && !loop; ++x) {
      loop = window[vendors[x] + 'RequestAnimationFrame']
      cancel = window[vendors[x] + 'CancelAnimationFrame'] ||
        window[vendors[x] + 'CancelRequestAnimationFrame']
    }

    if (!loop) {
      loop = function (callback) {
        var currTime = new Date().getTime()
        var timeToCall = Math.max(0, 16 - (currTime - lastTime))
        var id = window.setTimeout(function () { callback(currTime + timeToCall) }, timeToCall)
        lastTime = currTime + timeToCall
        return id
      }
    }

    if (!cancel) {
      cancel = window.clearTimeout
    }

    shims.loopEventByFrame = loop
    shims.cancelLoopEventByFrame = cancel
  })(shims)

  // Pages initializing
  ;(function initTopicPage (shims) {
    // Import shims
    var forEach = shims.forEach
    var filter = shims.filter
    var addEvent = shims.addEvent
    var loopEventByFrame = shims.loopEventByFrame
    var cancelLoopEventByFrame = shims.cancelLoopEventByFrame
    // HTML element class hooks
    var classContainer = 'j-overview-topic-container'
    var classItem = 'j-overview-topic-item'
    var classChangeAnchor = 'j-overview-topic-change'
    var __itemSelected = 'overview_topic-item__selected'
    // For navigation auto scrolling
    // Variable scrollReservZoneWidth define the width of the reserve zone on where the mousemove event take no effect. The reserve zone locate in the beginning and the end of the scroll mapping zone. The scrollSpeedFactor control the speed of scrolling
    var classNavScrollZone = 'j-overview-topic-nav'
    var scrollReserveZoneWidth = 40
    var scrollSpeedFactor = 0.2
    // Prepared stuffs
    var bodyRect = document.body.getBoundingClientRect()

    function switchTheme ($el, theme) {
      forEach($el.classList, function (className) {
        if (/^theme\-/.test(className)) $el.classList.remove(className)
      })
      $el.classList.add('theme-' + theme)
    }

    // Decoupled processors
    function processContainer ($container, index, $containers) {
      var ctx = {
        $container: $container
      }
      var $navs = $container.getElementsByClassName(classNavScrollZone)
      if ($navs) forEach($navs, processNavigation, ctx)
    }

    // process switch themes and assign the selected item to $selectedItem, it require passing the $container to be themed
    function processNavigation ($nav) {
      var ctx = {
        $container: this.$container,
        $nav: $nav,
        $selectedItem: null
      }

      makeNavigationScrollable.call(ctx, $nav)
      var $items = $nav.getElementsByClassName(classItem)
      if ($items) {
        // Only the first selected item counts
        var $selectedItems = filter($items, function ($item) {
          return $item.classList.contains(__itemSelected)
        })
        if ($selectedItems.length) ctx.$selectedItem = $selectedItems[0]
        forEach($items, processItem, ctx)
      }
    }

    // Mouse moving on navigation zone scroll the topics into the navigation view zone
    function makeNavigationScrollable ($nav) {
      var ctx = {
        $container: this.$container,
        $nav: this.$nav,
        $selectedItem: this.$selectedItem
      }
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

      // Mouse moving event trigger navigation scrolling
      addEvent($nav, 'mousemove', function (e) {
        mouseOverX = e.pageX - (navRect.left - bodyRect.left)
        mouseOverRateX = mouseOverX < scrollReserveZoneWidth ? 0
          : mouseOverX > navClientWidth - scrollReserveZoneWidth ? 1
          : (mouseOverX - scrollReserveZoneWidth) / (navClientWidth - scrollReserveZoneWidth * 2)
        cancelLoopEventByFrame(scrollFrameId)
        scrollFrameId = loopEventByFrame(function loop () {
          if ($nav.scrollWidth <= navClientWidth) return
          navScrollMaxDistance = $nav.scrollWidth - navClientWidth
          navScrollLeft = $nav.scrollLeft
          navScrollLeftTo = navScrollMaxDistance * mouseOverRateX
          navScrollLeftDistance = navScrollLeftTo - navScrollLeft
          if (navScrollLeftDistance > 0) {
            // Positive distance means $nav need to scroll toward right
            if (navScrollLeftTo * scrollSpeedFactor < navScrollLeftDistance) {
              $nav.scrollLeft += navScrollLeftTo * scrollSpeedFactor
              scrollFrameId = loopEventByFrame(loop)
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
      // Mouse leaving navigation set right the selected item
      addEvent($nav, 'mouseleave', function (e) {
        if (ctx.$selectedItem) {
          $nav.scrollLeft = ctx.$selectedItem.offsetLeft - $nav.offsetLeft
        } else {
          $nav.scrollLeft = 0
        }
      })
    }

    // Make clicking on anchor switch the themes and assign the selected item to $selectedItem
    function processItem ($item, index, $items) {
      var ctx = {
        $container: this.$container,
        $nav: this.$nav,
        $selectedItem: this.$selectedItem,
        $item: $item
      }

      // Must the first anchor works on clicking
      var $anchors = $item.getElementsByClassName(classChangeAnchor)
      var $anchor = $anchors ? $anchors[0] : null

      if ($anchor) {
        addEvent($anchor, 'click', function (e) {
          e.preventDefault()
          switchTheme(ctx.$container, $anchor.getAttribute('data-theme'))
          forEach($items, function ($item) {
            $item.classList.remove(__itemSelected)
          })
          $item.classList.add(__itemSelected)
          ctx.$selectedItem = $item
        })
      }
    }

    // Clicking topic change anchor switch the theme mounted on the topic container
    var $containers = document.getElementsByClassName(classContainer)
    if ($containers) {
      forEach($containers, processContainer)
    }
  })(shims)
}
