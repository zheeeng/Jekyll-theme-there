window.onload = function () {
  // Shims to be fulfilled
  var shims = {
    context: null,
    forEach: null,
    filter: null,
    addEvent: null,
    loopEventByFrame: null,
    cancelLoopEventByFrame: null,
    throttle: null
  }

  // shims.context
  ;(function (shims) {
    function Scope (uberScope) {
      if (typeof uberScope !== 'object' || uberScope === null) throw TypeError('The uberScope isn\'t a object')
      if (Object.defineProperties) {
        Object.defineProperties(this, {
          '__uber__': { value: uberScope },
          '__scope__': { value: {} }
        })
      } else {
        this.__uber__ = uberScope
        this.__scope__ = {}
      }
    }

    function set (prop, value) {
      this.__scope__[prop] = value
    }

    function get (prop) {
      var local = this
      while (local.__scope__[prop] === void 0 && local.hasOwnProperty('__uber__')) {
        local = local.__uber__
      }
      return local.__scope__[prop]
    }

    function mutate (prop, value) {
      var local = this
      while (local.__scope__[prop] === void 0 && local.hasOwnProperty('__uber__')) {
        local = local.__uber__
      }
      if (local.__scope__[prop] !== void 0) local.__scope__[prop] = value
      else throw Error('No mutable prop ' + prop + ' in the scope chain!')
    }

    if (Object.defineProperties) {
      Object.defineProperties(Scope.prototype, {
        'set': { value: set },
        'get': { value: get },
        'mutate': { value: mutate }
      })
    } else {
      Scope.prototype.set = set
      Scope.prototype.get = get
      Scope.prototype.mutate = mutate
    }

    shims.context = function (uberScope) {
      return new Scope(uberScope)
    }
  })(shims)

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

  ;(function (shims) {
    shims.throttle = function (fn, threshhold, ctx) {
      if (typeof fn !== 'function') throw new TypeError('Parameter fn is not a function')
      if (threshhold === void 0) threshhold = 250
      var lastTime = 0
      var timer
      return function () {
        if (ctx === void 0) ctx = this
        var currentTime = +new Date()
        var args = arguments
        var timeToCall = Math.max(0, threshhold - (currentTime - lastTime))
        window.clearTimeout(timer)
        timer = window.setTimeout(function () {
          fn.apply(ctx, args)
          lastTime = currentTime + timeToCall
        }, timeToCall)
      }
    }
  })(shims)

  // Pages initializing
  ;(function initTopicPage (shims) {
    // Import shims
    var context = shims.context
    var forEach = shims.forEach
    var filter = shims.filter
    var addEvent = shims.addEvent
    var loopEventByFrame = shims.loopEventByFrame
    var cancelLoopEventByFrame = shims.cancelLoopEventByFrame
    var throttle = shims.throttle
    // HTML element class hooks
    var classContainer = 'j-overview-topic-container'
    var classItem = 'j-overview-topic-item'
    var classChangeAnchor = 'j-overview-topic-change'
    var __itemSelected = 'overview_topic-item__selected'
    // For navigation auto scrolling
    // Variable scrollReservZoneWidth define the width of the reserve zone on where the mouse moving event take no effect. The reserve zone locate in the beginning and the end of the scroll mapping zone. The scrollSpeedFactor control the speed of scrolling
    var classNavScrollZone = 'j-overview-topic-nav'
    var scrollReserveZoneWidth = 40
    var scrollSpeedFactor = 0.05
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
      var ctx = this
      ctx.set('$container', $container)
      // Process the $navs under the $container
      var $navs = $container.getElementsByClassName(classNavScrollZone)
      if ($navs) forEach($navs, processNavigation, context(ctx))
    }

    function processNavigation ($nav) {
      var ctx = this
      ctx.set('$nav', $nav)
      ctx.set('$selectedItem', null)

      // Add mouse moving and mouse leaving events on the $nav
      addMouseEventsOnNavigation.call(context(ctx), $nav)

      // Add clicking events on $items (on their $anchors in actually)
      var $items = $nav.getElementsByClassName(classItem)
      if ($items) {
        // Assign the initial selected item to the variable $selectedItem, only the first selected item counts
        var $selectedItems = filter($items, function ($item) {
          return $item.classList.contains(__itemSelected)
        })
        if ($selectedItems.length) ctx.mutate('$selectedItem', $selectedItems[0])
        // Process the $items under the $nav
        forEach($items, processItem, context(ctx))
      }
    }

    // 1. Mouse moving event on navigation scroll the navigation bar
    // 2. Mouse leaving event on navigation scroll the selected heading into view
    function addMouseEventsOnNavigation ($nav) {
      var ctx = this
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
      var $selectedItem

      // Auxiliary function
      function scroll (loop) {
        if (navScrollLeftDistance > 0) {
          // Positive distance means the $nav need to scroll toward right
          if (navScrollLeftTo * scrollSpeedFactor < navScrollLeftDistance) {
            $nav.scrollLeft += navScrollLeftTo * scrollSpeedFactor
            scrollFrameId = loopEventByFrame(loop)
          } else {
            $nav.scrollLeft += navScrollLeftDistance
          }
        } else if (navScrollLeftDistance < 0) {
          navScrollLeftDistance = -navScrollLeftDistance
          // Negative distance means the $nav need to scroll toward left
          if ((navScrollMaxDistance - navScrollLeftTo) * scrollSpeedFactor < navScrollLeftDistance) {
            $nav.scrollLeft -= (navScrollMaxDistance - navScrollLeftTo) * scrollSpeedFactor
            scrollFrameId = requestAnimationFrame(loop)
          } else {
            $nav.scrollLeft -= navScrollLeftDistance
          }
        }
      }

      // Mouse moving on the navigation zone scroll the headings into the navigation view zone
      addEvent($nav, 'mousemove', throttle(function (e) {
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
          scroll(loop)
        })
      }, 60))
      // Mouse leaving navigation set right the selected item
      addEvent($nav, 'mouseleave', function (e) {
        $selectedItem = ctx.get('$selectedItem')
        cancelLoopEventByFrame(scrollFrameId)
        scrollFrameId = loopEventByFrame(function loop () {
          if ($nav.scrollWidth <= navClientWidth) return
          navScrollMaxDistance = $nav.scrollWidth - navClientWidth
          navScrollLeft = $nav.scrollLeft
          navScrollLeftTo = $selectedItem ? $selectedItem.offsetLeft - $nav.offsetLeft : 0
          navScrollLeftDistance = navScrollLeftTo - navScrollLeft
          scroll(loop)
        })
      })
    }

    // 1. Process switching themes, it require the execution context contains the $container which to be themed
    // 2. and assign the selected item to the variable $selectedItem which reference to the $selectedItem in the execution context
    function processItem ($item, index, $items) {
      var ctx = this
      ctx.set('$item', $item)

      var $container = ctx.get('$container')

      // Must the first anchor works on clicking event
      var $anchors = $item.getElementsByClassName(classChangeAnchor)
      var $anchor = $anchors ? $anchors[0] : null

      if ($anchor) {
        addEvent($anchor, 'click', function (e) {
          e.preventDefault()
          switchTheme($container, $anchor.getAttribute('data-theme'))
          forEach($items, function ($item) {
            $item.classList.remove(__itemSelected)
          })
          $item.classList.add(__itemSelected)
          ctx.mutate('$selectedItem', $item)
        })
      }
    }

    // Initialization entry
    var $containers = document.getElementsByClassName(classContainer)
    if ($containers) {
      forEach($containers, processContainer, context({}))
    }
  })(shims)
}
