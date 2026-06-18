(() => {
  var __create = Object.create;
  var __defProp = Object.defineProperty;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __getProtoOf = Object.getPrototypeOf;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __commonJS = (cb, mod) => function __require() {
    try {
      return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
    } catch (e) {
      throw mod = 0, e;
    }
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
    // If the importer is in node compatibility mode or this is not an ESM
    // file that has been converted to a CommonJS file using a Babel-
    // compatible transform (i.e. "__esModule" has not been set), then set
    // "default" to the CommonJS "module.exports" for node compatibility.
    isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
    mod
  ));

  // node_modules/react/cjs/react.production.js
  var require_react_production = __commonJS({
    "node_modules/react/cjs/react.production.js"(exports) {
      "use strict";
      var REACT_ELEMENT_TYPE = /* @__PURE__ */ Symbol.for("react.transitional.element");
      var REACT_PORTAL_TYPE = /* @__PURE__ */ Symbol.for("react.portal");
      var REACT_FRAGMENT_TYPE = /* @__PURE__ */ Symbol.for("react.fragment");
      var REACT_STRICT_MODE_TYPE = /* @__PURE__ */ Symbol.for("react.strict_mode");
      var REACT_PROFILER_TYPE = /* @__PURE__ */ Symbol.for("react.profiler");
      var REACT_CONSUMER_TYPE = /* @__PURE__ */ Symbol.for("react.consumer");
      var REACT_CONTEXT_TYPE = /* @__PURE__ */ Symbol.for("react.context");
      var REACT_FORWARD_REF_TYPE = /* @__PURE__ */ Symbol.for("react.forward_ref");
      var REACT_SUSPENSE_TYPE = /* @__PURE__ */ Symbol.for("react.suspense");
      var REACT_MEMO_TYPE = /* @__PURE__ */ Symbol.for("react.memo");
      var REACT_LAZY_TYPE = /* @__PURE__ */ Symbol.for("react.lazy");
      var REACT_ACTIVITY_TYPE = /* @__PURE__ */ Symbol.for("react.activity");
      var MAYBE_ITERATOR_SYMBOL = Symbol.iterator;
      function getIteratorFn(maybeIterable) {
        if (null === maybeIterable || "object" !== typeof maybeIterable) return null;
        maybeIterable = MAYBE_ITERATOR_SYMBOL && maybeIterable[MAYBE_ITERATOR_SYMBOL] || maybeIterable["@@iterator"];
        return "function" === typeof maybeIterable ? maybeIterable : null;
      }
      var ReactNoopUpdateQueue = {
        isMounted: function() {
          return false;
        },
        enqueueForceUpdate: function() {
        },
        enqueueReplaceState: function() {
        },
        enqueueSetState: function() {
        }
      };
      var assign = Object.assign;
      var emptyObject = {};
      function Component(props, context, updater) {
        this.props = props;
        this.context = context;
        this.refs = emptyObject;
        this.updater = updater || ReactNoopUpdateQueue;
      }
      Component.prototype.isReactComponent = {};
      Component.prototype.setState = function(partialState, callback) {
        if ("object" !== typeof partialState && "function" !== typeof partialState && null != partialState)
          throw Error(
            "takes an object of state variables to update or a function which returns an object of state variables."
          );
        this.updater.enqueueSetState(this, partialState, callback, "setState");
      };
      Component.prototype.forceUpdate = function(callback) {
        this.updater.enqueueForceUpdate(this, callback, "forceUpdate");
      };
      function ComponentDummy() {
      }
      ComponentDummy.prototype = Component.prototype;
      function PureComponent(props, context, updater) {
        this.props = props;
        this.context = context;
        this.refs = emptyObject;
        this.updater = updater || ReactNoopUpdateQueue;
      }
      var pureComponentPrototype = PureComponent.prototype = new ComponentDummy();
      pureComponentPrototype.constructor = PureComponent;
      assign(pureComponentPrototype, Component.prototype);
      pureComponentPrototype.isPureReactComponent = true;
      var isArrayImpl = Array.isArray;
      function noop() {
      }
      var ReactSharedInternals = { H: null, A: null, T: null, S: null };
      var hasOwnProperty = Object.prototype.hasOwnProperty;
      function ReactElement(type, key, props) {
        var refProp = props.ref;
        return {
          $$typeof: REACT_ELEMENT_TYPE,
          type,
          key,
          ref: void 0 !== refProp ? refProp : null,
          props
        };
      }
      function cloneAndReplaceKey(oldElement, newKey) {
        return ReactElement(oldElement.type, newKey, oldElement.props);
      }
      function isValidElement(object) {
        return "object" === typeof object && null !== object && object.$$typeof === REACT_ELEMENT_TYPE;
      }
      function escape(key) {
        var escaperLookup = { "=": "=0", ":": "=2" };
        return "$" + key.replace(/[=:]/g, function(match) {
          return escaperLookup[match];
        });
      }
      var userProvidedKeyEscapeRegex = /\/+/g;
      function getElementKey(element, index) {
        return "object" === typeof element && null !== element && null != element.key ? escape("" + element.key) : index.toString(36);
      }
      function resolveThenable(thenable) {
        switch (thenable.status) {
          case "fulfilled":
            return thenable.value;
          case "rejected":
            throw thenable.reason;
          default:
            switch ("string" === typeof thenable.status ? thenable.then(noop, noop) : (thenable.status = "pending", thenable.then(
              function(fulfilledValue) {
                "pending" === thenable.status && (thenable.status = "fulfilled", thenable.value = fulfilledValue);
              },
              function(error) {
                "pending" === thenable.status && (thenable.status = "rejected", thenable.reason = error);
              }
            )), thenable.status) {
              case "fulfilled":
                return thenable.value;
              case "rejected":
                throw thenable.reason;
            }
        }
        throw thenable;
      }
      function mapIntoArray(children, array, escapedPrefix, nameSoFar, callback) {
        var type = typeof children;
        if ("undefined" === type || "boolean" === type) children = null;
        var invokeCallback = false;
        if (null === children) invokeCallback = true;
        else
          switch (type) {
            case "bigint":
            case "string":
            case "number":
              invokeCallback = true;
              break;
            case "object":
              switch (children.$$typeof) {
                case REACT_ELEMENT_TYPE:
                case REACT_PORTAL_TYPE:
                  invokeCallback = true;
                  break;
                case REACT_LAZY_TYPE:
                  return invokeCallback = children._init, mapIntoArray(
                    invokeCallback(children._payload),
                    array,
                    escapedPrefix,
                    nameSoFar,
                    callback
                  );
              }
          }
        if (invokeCallback)
          return callback = callback(children), invokeCallback = "" === nameSoFar ? "." + getElementKey(children, 0) : nameSoFar, isArrayImpl(callback) ? (escapedPrefix = "", null != invokeCallback && (escapedPrefix = invokeCallback.replace(userProvidedKeyEscapeRegex, "$&/") + "/"), mapIntoArray(callback, array, escapedPrefix, "", function(c) {
            return c;
          })) : null != callback && (isValidElement(callback) && (callback = cloneAndReplaceKey(
            callback,
            escapedPrefix + (null == callback.key || children && children.key === callback.key ? "" : ("" + callback.key).replace(
              userProvidedKeyEscapeRegex,
              "$&/"
            ) + "/") + invokeCallback
          )), array.push(callback)), 1;
        invokeCallback = 0;
        var nextNamePrefix = "" === nameSoFar ? "." : nameSoFar + ":";
        if (isArrayImpl(children))
          for (var i = 0; i < children.length; i++)
            nameSoFar = children[i], type = nextNamePrefix + getElementKey(nameSoFar, i), invokeCallback += mapIntoArray(
              nameSoFar,
              array,
              escapedPrefix,
              type,
              callback
            );
        else if (i = getIteratorFn(children), "function" === typeof i)
          for (children = i.call(children), i = 0; !(nameSoFar = children.next()).done; )
            nameSoFar = nameSoFar.value, type = nextNamePrefix + getElementKey(nameSoFar, i++), invokeCallback += mapIntoArray(
              nameSoFar,
              array,
              escapedPrefix,
              type,
              callback
            );
        else if ("object" === type) {
          if ("function" === typeof children.then)
            return mapIntoArray(
              resolveThenable(children),
              array,
              escapedPrefix,
              nameSoFar,
              callback
            );
          array = String(children);
          throw Error(
            "Objects are not valid as a React child (found: " + ("[object Object]" === array ? "object with keys {" + Object.keys(children).join(", ") + "}" : array) + "). If you meant to render a collection of children, use an array instead."
          );
        }
        return invokeCallback;
      }
      function mapChildren(children, func, context) {
        if (null == children) return children;
        var result = [], count = 0;
        mapIntoArray(children, result, "", "", function(child) {
          return func.call(context, child, count++);
        });
        return result;
      }
      function lazyInitializer(payload) {
        if (-1 === payload._status) {
          var ctor = payload._result;
          ctor = ctor();
          ctor.then(
            function(moduleObject) {
              if (0 === payload._status || -1 === payload._status)
                payload._status = 1, payload._result = moduleObject;
            },
            function(error) {
              if (0 === payload._status || -1 === payload._status)
                payload._status = 2, payload._result = error;
            }
          );
          -1 === payload._status && (payload._status = 0, payload._result = ctor);
        }
        if (1 === payload._status) return payload._result.default;
        throw payload._result;
      }
      var reportGlobalError = "function" === typeof reportError ? reportError : function(error) {
        if ("object" === typeof window && "function" === typeof window.ErrorEvent) {
          var event = new window.ErrorEvent("error", {
            bubbles: true,
            cancelable: true,
            message: "object" === typeof error && null !== error && "string" === typeof error.message ? String(error.message) : String(error),
            error
          });
          if (!window.dispatchEvent(event)) return;
        } else if ("object" === typeof process && "function" === typeof process.emit) {
          process.emit("uncaughtException", error);
          return;
        }
        console.error(error);
      };
      var Children = {
        map: mapChildren,
        forEach: function(children, forEachFunc, forEachContext) {
          mapChildren(
            children,
            function() {
              forEachFunc.apply(this, arguments);
            },
            forEachContext
          );
        },
        count: function(children) {
          var n = 0;
          mapChildren(children, function() {
            n++;
          });
          return n;
        },
        toArray: function(children) {
          return mapChildren(children, function(child) {
            return child;
          }) || [];
        },
        only: function(children) {
          if (!isValidElement(children))
            throw Error(
              "React.Children.only expected to receive a single React element child."
            );
          return children;
        }
      };
      exports.Activity = REACT_ACTIVITY_TYPE;
      exports.Children = Children;
      exports.Component = Component;
      exports.Fragment = REACT_FRAGMENT_TYPE;
      exports.Profiler = REACT_PROFILER_TYPE;
      exports.PureComponent = PureComponent;
      exports.StrictMode = REACT_STRICT_MODE_TYPE;
      exports.Suspense = REACT_SUSPENSE_TYPE;
      exports.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE = ReactSharedInternals;
      exports.__COMPILER_RUNTIME = {
        __proto__: null,
        c: function(size) {
          return ReactSharedInternals.H.useMemoCache(size);
        }
      };
      exports.cache = function(fn) {
        return function() {
          return fn.apply(null, arguments);
        };
      };
      exports.cacheSignal = function() {
        return null;
      };
      exports.cloneElement = function(element, config, children) {
        if (null === element || void 0 === element)
          throw Error(
            "The argument must be a React element, but you passed " + element + "."
          );
        var props = assign({}, element.props), key = element.key;
        if (null != config)
          for (propName in void 0 !== config.key && (key = "" + config.key), config)
            !hasOwnProperty.call(config, propName) || "key" === propName || "__self" === propName || "__source" === propName || "ref" === propName && void 0 === config.ref || (props[propName] = config[propName]);
        var propName = arguments.length - 2;
        if (1 === propName) props.children = children;
        else if (1 < propName) {
          for (var childArray = Array(propName), i = 0; i < propName; i++)
            childArray[i] = arguments[i + 2];
          props.children = childArray;
        }
        return ReactElement(element.type, key, props);
      };
      exports.createContext = function(defaultValue) {
        defaultValue = {
          $$typeof: REACT_CONTEXT_TYPE,
          _currentValue: defaultValue,
          _currentValue2: defaultValue,
          _threadCount: 0,
          Provider: null,
          Consumer: null
        };
        defaultValue.Provider = defaultValue;
        defaultValue.Consumer = {
          $$typeof: REACT_CONSUMER_TYPE,
          _context: defaultValue
        };
        return defaultValue;
      };
      exports.createElement = function(type, config, children) {
        var propName, props = {}, key = null;
        if (null != config)
          for (propName in void 0 !== config.key && (key = "" + config.key), config)
            hasOwnProperty.call(config, propName) && "key" !== propName && "__self" !== propName && "__source" !== propName && (props[propName] = config[propName]);
        var childrenLength = arguments.length - 2;
        if (1 === childrenLength) props.children = children;
        else if (1 < childrenLength) {
          for (var childArray = Array(childrenLength), i = 0; i < childrenLength; i++)
            childArray[i] = arguments[i + 2];
          props.children = childArray;
        }
        if (type && type.defaultProps)
          for (propName in childrenLength = type.defaultProps, childrenLength)
            void 0 === props[propName] && (props[propName] = childrenLength[propName]);
        return ReactElement(type, key, props);
      };
      exports.createRef = function() {
        return { current: null };
      };
      exports.forwardRef = function(render) {
        return { $$typeof: REACT_FORWARD_REF_TYPE, render };
      };
      exports.isValidElement = isValidElement;
      exports.lazy = function(ctor) {
        return {
          $$typeof: REACT_LAZY_TYPE,
          _payload: { _status: -1, _result: ctor },
          _init: lazyInitializer
        };
      };
      exports.memo = function(type, compare) {
        return {
          $$typeof: REACT_MEMO_TYPE,
          type,
          compare: void 0 === compare ? null : compare
        };
      };
      exports.startTransition = function(scope) {
        var prevTransition = ReactSharedInternals.T, currentTransition = {};
        ReactSharedInternals.T = currentTransition;
        try {
          var returnValue = scope(), onStartTransitionFinish = ReactSharedInternals.S;
          null !== onStartTransitionFinish && onStartTransitionFinish(currentTransition, returnValue);
          "object" === typeof returnValue && null !== returnValue && "function" === typeof returnValue.then && returnValue.then(noop, reportGlobalError);
        } catch (error) {
          reportGlobalError(error);
        } finally {
          null !== prevTransition && null !== currentTransition.types && (prevTransition.types = currentTransition.types), ReactSharedInternals.T = prevTransition;
        }
      };
      exports.unstable_useCacheRefresh = function() {
        return ReactSharedInternals.H.useCacheRefresh();
      };
      exports.use = function(usable) {
        return ReactSharedInternals.H.use(usable);
      };
      exports.useActionState = function(action, initialState, permalink) {
        return ReactSharedInternals.H.useActionState(action, initialState, permalink);
      };
      exports.useCallback = function(callback, deps) {
        return ReactSharedInternals.H.useCallback(callback, deps);
      };
      exports.useContext = function(Context) {
        return ReactSharedInternals.H.useContext(Context);
      };
      exports.useDebugValue = function() {
      };
      exports.useDeferredValue = function(value, initialValue) {
        return ReactSharedInternals.H.useDeferredValue(value, initialValue);
      };
      exports.useEffect = function(create, deps) {
        return ReactSharedInternals.H.useEffect(create, deps);
      };
      exports.useEffectEvent = function(callback) {
        return ReactSharedInternals.H.useEffectEvent(callback);
      };
      exports.useId = function() {
        return ReactSharedInternals.H.useId();
      };
      exports.useImperativeHandle = function(ref, create, deps) {
        return ReactSharedInternals.H.useImperativeHandle(ref, create, deps);
      };
      exports.useInsertionEffect = function(create, deps) {
        return ReactSharedInternals.H.useInsertionEffect(create, deps);
      };
      exports.useLayoutEffect = function(create, deps) {
        return ReactSharedInternals.H.useLayoutEffect(create, deps);
      };
      exports.useMemo = function(create, deps) {
        return ReactSharedInternals.H.useMemo(create, deps);
      };
      exports.useOptimistic = function(passthrough, reducer) {
        return ReactSharedInternals.H.useOptimistic(passthrough, reducer);
      };
      exports.useReducer = function(reducer, initialArg, init) {
        return ReactSharedInternals.H.useReducer(reducer, initialArg, init);
      };
      exports.useRef = function(initialValue) {
        return ReactSharedInternals.H.useRef(initialValue);
      };
      exports.useState = function(initialState) {
        return ReactSharedInternals.H.useState(initialState);
      };
      exports.useSyncExternalStore = function(subscribe, getSnapshot, getServerSnapshot) {
        return ReactSharedInternals.H.useSyncExternalStore(
          subscribe,
          getSnapshot,
          getServerSnapshot
        );
      };
      exports.useTransition = function() {
        return ReactSharedInternals.H.useTransition();
      };
      exports.version = "19.2.7";
    }
  });

  // node_modules/react/index.js
  var require_react = __commonJS({
    "node_modules/react/index.js"(exports, module) {
      "use strict";
      if (true) {
        module.exports = require_react_production();
      } else {
        module.exports = null;
      }
    }
  });

  // node_modules/scheduler/cjs/scheduler.production.js
  var require_scheduler_production = __commonJS({
    "node_modules/scheduler/cjs/scheduler.production.js"(exports) {
      "use strict";
      function push(heap, node) {
        var index = heap.length;
        heap.push(node);
        a: for (; 0 < index; ) {
          var parentIndex = index - 1 >>> 1, parent = heap[parentIndex];
          if (0 < compare(parent, node))
            heap[parentIndex] = node, heap[index] = parent, index = parentIndex;
          else break a;
        }
      }
      function peek(heap) {
        return 0 === heap.length ? null : heap[0];
      }
      function pop(heap) {
        if (0 === heap.length) return null;
        var first = heap[0], last = heap.pop();
        if (last !== first) {
          heap[0] = last;
          a: for (var index = 0, length = heap.length, halfLength = length >>> 1; index < halfLength; ) {
            var leftIndex = 2 * (index + 1) - 1, left = heap[leftIndex], rightIndex = leftIndex + 1, right = heap[rightIndex];
            if (0 > compare(left, last))
              rightIndex < length && 0 > compare(right, left) ? (heap[index] = right, heap[rightIndex] = last, index = rightIndex) : (heap[index] = left, heap[leftIndex] = last, index = leftIndex);
            else if (rightIndex < length && 0 > compare(right, last))
              heap[index] = right, heap[rightIndex] = last, index = rightIndex;
            else break a;
          }
        }
        return first;
      }
      function compare(a, b) {
        var diff = a.sortIndex - b.sortIndex;
        return 0 !== diff ? diff : a.id - b.id;
      }
      exports.unstable_now = void 0;
      if ("object" === typeof performance && "function" === typeof performance.now) {
        localPerformance = performance;
        exports.unstable_now = function() {
          return localPerformance.now();
        };
      } else {
        localDate = Date, initialTime = localDate.now();
        exports.unstable_now = function() {
          return localDate.now() - initialTime;
        };
      }
      var localPerformance;
      var localDate;
      var initialTime;
      var taskQueue = [];
      var timerQueue = [];
      var taskIdCounter = 1;
      var currentTask = null;
      var currentPriorityLevel = 3;
      var isPerformingWork = false;
      var isHostCallbackScheduled = false;
      var isHostTimeoutScheduled = false;
      var needsPaint = false;
      var localSetTimeout = "function" === typeof setTimeout ? setTimeout : null;
      var localClearTimeout = "function" === typeof clearTimeout ? clearTimeout : null;
      var localSetImmediate = "undefined" !== typeof setImmediate ? setImmediate : null;
      function advanceTimers(currentTime) {
        for (var timer = peek(timerQueue); null !== timer; ) {
          if (null === timer.callback) pop(timerQueue);
          else if (timer.startTime <= currentTime)
            pop(timerQueue), timer.sortIndex = timer.expirationTime, push(taskQueue, timer);
          else break;
          timer = peek(timerQueue);
        }
      }
      function handleTimeout(currentTime) {
        isHostTimeoutScheduled = false;
        advanceTimers(currentTime);
        if (!isHostCallbackScheduled)
          if (null !== peek(taskQueue))
            isHostCallbackScheduled = true, isMessageLoopRunning || (isMessageLoopRunning = true, schedulePerformWorkUntilDeadline());
          else {
            var firstTimer = peek(timerQueue);
            null !== firstTimer && requestHostTimeout(handleTimeout, firstTimer.startTime - currentTime);
          }
      }
      var isMessageLoopRunning = false;
      var taskTimeoutID = -1;
      var frameInterval = 5;
      var startTime = -1;
      function shouldYieldToHost() {
        return needsPaint ? true : exports.unstable_now() - startTime < frameInterval ? false : true;
      }
      function performWorkUntilDeadline() {
        needsPaint = false;
        if (isMessageLoopRunning) {
          var currentTime = exports.unstable_now();
          startTime = currentTime;
          var hasMoreWork = true;
          try {
            a: {
              isHostCallbackScheduled = false;
              isHostTimeoutScheduled && (isHostTimeoutScheduled = false, localClearTimeout(taskTimeoutID), taskTimeoutID = -1);
              isPerformingWork = true;
              var previousPriorityLevel = currentPriorityLevel;
              try {
                b: {
                  advanceTimers(currentTime);
                  for (currentTask = peek(taskQueue); null !== currentTask && !(currentTask.expirationTime > currentTime && shouldYieldToHost()); ) {
                    var callback = currentTask.callback;
                    if ("function" === typeof callback) {
                      currentTask.callback = null;
                      currentPriorityLevel = currentTask.priorityLevel;
                      var continuationCallback = callback(
                        currentTask.expirationTime <= currentTime
                      );
                      currentTime = exports.unstable_now();
                      if ("function" === typeof continuationCallback) {
                        currentTask.callback = continuationCallback;
                        advanceTimers(currentTime);
                        hasMoreWork = true;
                        break b;
                      }
                      currentTask === peek(taskQueue) && pop(taskQueue);
                      advanceTimers(currentTime);
                    } else pop(taskQueue);
                    currentTask = peek(taskQueue);
                  }
                  if (null !== currentTask) hasMoreWork = true;
                  else {
                    var firstTimer = peek(timerQueue);
                    null !== firstTimer && requestHostTimeout(
                      handleTimeout,
                      firstTimer.startTime - currentTime
                    );
                    hasMoreWork = false;
                  }
                }
                break a;
              } finally {
                currentTask = null, currentPriorityLevel = previousPriorityLevel, isPerformingWork = false;
              }
              hasMoreWork = void 0;
            }
          } finally {
            hasMoreWork ? schedulePerformWorkUntilDeadline() : isMessageLoopRunning = false;
          }
        }
      }
      var schedulePerformWorkUntilDeadline;
      if ("function" === typeof localSetImmediate)
        schedulePerformWorkUntilDeadline = function() {
          localSetImmediate(performWorkUntilDeadline);
        };
      else if ("undefined" !== typeof MessageChannel) {
        channel = new MessageChannel(), port = channel.port2;
        channel.port1.onmessage = performWorkUntilDeadline;
        schedulePerformWorkUntilDeadline = function() {
          port.postMessage(null);
        };
      } else
        schedulePerformWorkUntilDeadline = function() {
          localSetTimeout(performWorkUntilDeadline, 0);
        };
      var channel;
      var port;
      function requestHostTimeout(callback, ms) {
        taskTimeoutID = localSetTimeout(function() {
          callback(exports.unstable_now());
        }, ms);
      }
      exports.unstable_IdlePriority = 5;
      exports.unstable_ImmediatePriority = 1;
      exports.unstable_LowPriority = 4;
      exports.unstable_NormalPriority = 3;
      exports.unstable_Profiling = null;
      exports.unstable_UserBlockingPriority = 2;
      exports.unstable_cancelCallback = function(task) {
        task.callback = null;
      };
      exports.unstable_forceFrameRate = function(fps) {
        0 > fps || 125 < fps ? console.error(
          "forceFrameRate takes a positive int between 0 and 125, forcing frame rates higher than 125 fps is not supported"
        ) : frameInterval = 0 < fps ? Math.floor(1e3 / fps) : 5;
      };
      exports.unstable_getCurrentPriorityLevel = function() {
        return currentPriorityLevel;
      };
      exports.unstable_next = function(eventHandler) {
        switch (currentPriorityLevel) {
          case 1:
          case 2:
          case 3:
            var priorityLevel = 3;
            break;
          default:
            priorityLevel = currentPriorityLevel;
        }
        var previousPriorityLevel = currentPriorityLevel;
        currentPriorityLevel = priorityLevel;
        try {
          return eventHandler();
        } finally {
          currentPriorityLevel = previousPriorityLevel;
        }
      };
      exports.unstable_requestPaint = function() {
        needsPaint = true;
      };
      exports.unstable_runWithPriority = function(priorityLevel, eventHandler) {
        switch (priorityLevel) {
          case 1:
          case 2:
          case 3:
          case 4:
          case 5:
            break;
          default:
            priorityLevel = 3;
        }
        var previousPriorityLevel = currentPriorityLevel;
        currentPriorityLevel = priorityLevel;
        try {
          return eventHandler();
        } finally {
          currentPriorityLevel = previousPriorityLevel;
        }
      };
      exports.unstable_scheduleCallback = function(priorityLevel, callback, options) {
        var currentTime = exports.unstable_now();
        "object" === typeof options && null !== options ? (options = options.delay, options = "number" === typeof options && 0 < options ? currentTime + options : currentTime) : options = currentTime;
        switch (priorityLevel) {
          case 1:
            var timeout = -1;
            break;
          case 2:
            timeout = 250;
            break;
          case 5:
            timeout = 1073741823;
            break;
          case 4:
            timeout = 1e4;
            break;
          default:
            timeout = 5e3;
        }
        timeout = options + timeout;
        priorityLevel = {
          id: taskIdCounter++,
          callback,
          priorityLevel,
          startTime: options,
          expirationTime: timeout,
          sortIndex: -1
        };
        options > currentTime ? (priorityLevel.sortIndex = options, push(timerQueue, priorityLevel), null === peek(taskQueue) && priorityLevel === peek(timerQueue) && (isHostTimeoutScheduled ? (localClearTimeout(taskTimeoutID), taskTimeoutID = -1) : isHostTimeoutScheduled = true, requestHostTimeout(handleTimeout, options - currentTime))) : (priorityLevel.sortIndex = timeout, push(taskQueue, priorityLevel), isHostCallbackScheduled || isPerformingWork || (isHostCallbackScheduled = true, isMessageLoopRunning || (isMessageLoopRunning = true, schedulePerformWorkUntilDeadline())));
        return priorityLevel;
      };
      exports.unstable_shouldYield = shouldYieldToHost;
      exports.unstable_wrapCallback = function(callback) {
        var parentPriorityLevel = currentPriorityLevel;
        return function() {
          var previousPriorityLevel = currentPriorityLevel;
          currentPriorityLevel = parentPriorityLevel;
          try {
            return callback.apply(this, arguments);
          } finally {
            currentPriorityLevel = previousPriorityLevel;
          }
        };
      };
    }
  });

  // node_modules/scheduler/index.js
  var require_scheduler = __commonJS({
    "node_modules/scheduler/index.js"(exports, module) {
      "use strict";
      if (true) {
        module.exports = require_scheduler_production();
      } else {
        module.exports = null;
      }
    }
  });

  // node_modules/react-dom/cjs/react-dom.production.js
  var require_react_dom_production = __commonJS({
    "node_modules/react-dom/cjs/react-dom.production.js"(exports) {
      "use strict";
      var React3 = require_react();
      function formatProdErrorMessage(code) {
        var url = "https://react.dev/errors/" + code;
        if (1 < arguments.length) {
          url += "?args[]=" + encodeURIComponent(arguments[1]);
          for (var i = 2; i < arguments.length; i++)
            url += "&args[]=" + encodeURIComponent(arguments[i]);
        }
        return "Minified React error #" + code + "; visit " + url + " for the full message or use the non-minified dev environment for full errors and additional helpful warnings.";
      }
      function noop() {
      }
      var Internals = {
        d: {
          f: noop,
          r: function() {
            throw Error(formatProdErrorMessage(522));
          },
          D: noop,
          C: noop,
          L: noop,
          m: noop,
          X: noop,
          S: noop,
          M: noop
        },
        p: 0,
        findDOMNode: null
      };
      var REACT_PORTAL_TYPE = /* @__PURE__ */ Symbol.for("react.portal");
      function createPortal$1(children, containerInfo, implementation) {
        var key = 3 < arguments.length && void 0 !== arguments[3] ? arguments[3] : null;
        return {
          $$typeof: REACT_PORTAL_TYPE,
          key: null == key ? null : "" + key,
          children,
          containerInfo,
          implementation
        };
      }
      var ReactSharedInternals = React3.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE;
      function getCrossOriginStringAs(as, input) {
        if ("font" === as) return "";
        if ("string" === typeof input)
          return "use-credentials" === input ? input : "";
      }
      exports.__DOM_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE = Internals;
      exports.createPortal = function(children, container) {
        var key = 2 < arguments.length && void 0 !== arguments[2] ? arguments[2] : null;
        if (!container || 1 !== container.nodeType && 9 !== container.nodeType && 11 !== container.nodeType)
          throw Error(formatProdErrorMessage(299));
        return createPortal$1(children, container, null, key);
      };
      exports.flushSync = function(fn) {
        var previousTransition = ReactSharedInternals.T, previousUpdatePriority = Internals.p;
        try {
          if (ReactSharedInternals.T = null, Internals.p = 2, fn) return fn();
        } finally {
          ReactSharedInternals.T = previousTransition, Internals.p = previousUpdatePriority, Internals.d.f();
        }
      };
      exports.preconnect = function(href, options) {
        "string" === typeof href && (options ? (options = options.crossOrigin, options = "string" === typeof options ? "use-credentials" === options ? options : "" : void 0) : options = null, Internals.d.C(href, options));
      };
      exports.prefetchDNS = function(href) {
        "string" === typeof href && Internals.d.D(href);
      };
      exports.preinit = function(href, options) {
        if ("string" === typeof href && options && "string" === typeof options.as) {
          var as = options.as, crossOrigin = getCrossOriginStringAs(as, options.crossOrigin), integrity = "string" === typeof options.integrity ? options.integrity : void 0, fetchPriority = "string" === typeof options.fetchPriority ? options.fetchPriority : void 0;
          "style" === as ? Internals.d.S(
            href,
            "string" === typeof options.precedence ? options.precedence : void 0,
            {
              crossOrigin,
              integrity,
              fetchPriority
            }
          ) : "script" === as && Internals.d.X(href, {
            crossOrigin,
            integrity,
            fetchPriority,
            nonce: "string" === typeof options.nonce ? options.nonce : void 0
          });
        }
      };
      exports.preinitModule = function(href, options) {
        if ("string" === typeof href)
          if ("object" === typeof options && null !== options) {
            if (null == options.as || "script" === options.as) {
              var crossOrigin = getCrossOriginStringAs(
                options.as,
                options.crossOrigin
              );
              Internals.d.M(href, {
                crossOrigin,
                integrity: "string" === typeof options.integrity ? options.integrity : void 0,
                nonce: "string" === typeof options.nonce ? options.nonce : void 0
              });
            }
          } else null == options && Internals.d.M(href);
      };
      exports.preload = function(href, options) {
        if ("string" === typeof href && "object" === typeof options && null !== options && "string" === typeof options.as) {
          var as = options.as, crossOrigin = getCrossOriginStringAs(as, options.crossOrigin);
          Internals.d.L(href, as, {
            crossOrigin,
            integrity: "string" === typeof options.integrity ? options.integrity : void 0,
            nonce: "string" === typeof options.nonce ? options.nonce : void 0,
            type: "string" === typeof options.type ? options.type : void 0,
            fetchPriority: "string" === typeof options.fetchPriority ? options.fetchPriority : void 0,
            referrerPolicy: "string" === typeof options.referrerPolicy ? options.referrerPolicy : void 0,
            imageSrcSet: "string" === typeof options.imageSrcSet ? options.imageSrcSet : void 0,
            imageSizes: "string" === typeof options.imageSizes ? options.imageSizes : void 0,
            media: "string" === typeof options.media ? options.media : void 0
          });
        }
      };
      exports.preloadModule = function(href, options) {
        if ("string" === typeof href)
          if (options) {
            var crossOrigin = getCrossOriginStringAs(options.as, options.crossOrigin);
            Internals.d.m(href, {
              as: "string" === typeof options.as && "script" !== options.as ? options.as : void 0,
              crossOrigin,
              integrity: "string" === typeof options.integrity ? options.integrity : void 0
            });
          } else Internals.d.m(href);
      };
      exports.requestFormReset = function(form) {
        Internals.d.r(form);
      };
      exports.unstable_batchedUpdates = function(fn, a) {
        return fn(a);
      };
      exports.useFormState = function(action, initialState, permalink) {
        return ReactSharedInternals.H.useFormState(action, initialState, permalink);
      };
      exports.useFormStatus = function() {
        return ReactSharedInternals.H.useHostTransitionStatus();
      };
      exports.version = "19.2.7";
    }
  });

  // node_modules/react-dom/index.js
  var require_react_dom = __commonJS({
    "node_modules/react-dom/index.js"(exports, module) {
      "use strict";
      function checkDCE() {
        if (typeof __REACT_DEVTOOLS_GLOBAL_HOOK__ === "undefined" || typeof __REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE !== "function") {
          return;
        }
        if (false) {
          throw new Error("^_^");
        }
        try {
          __REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE(checkDCE);
        } catch (err) {
          console.error(err);
        }
      }
      if (true) {
        checkDCE();
        module.exports = require_react_dom_production();
      } else {
        module.exports = null;
      }
    }
  });

  // node_modules/react-dom/cjs/react-dom-client.production.js
  var require_react_dom_client_production = __commonJS({
    "node_modules/react-dom/cjs/react-dom-client.production.js"(exports) {
      "use strict";
      var Scheduler = require_scheduler();
      var React3 = require_react();
      var ReactDOM2 = require_react_dom();
      function formatProdErrorMessage(code) {
        var url = "https://react.dev/errors/" + code;
        if (1 < arguments.length) {
          url += "?args[]=" + encodeURIComponent(arguments[1]);
          for (var i = 2; i < arguments.length; i++)
            url += "&args[]=" + encodeURIComponent(arguments[i]);
        }
        return "Minified React error #" + code + "; visit " + url + " for the full message or use the non-minified dev environment for full errors and additional helpful warnings.";
      }
      function isValidContainer(node) {
        return !(!node || 1 !== node.nodeType && 9 !== node.nodeType && 11 !== node.nodeType);
      }
      function getNearestMountedFiber(fiber) {
        var node = fiber, nearestMounted = fiber;
        if (fiber.alternate) for (; node.return; ) node = node.return;
        else {
          fiber = node;
          do
            node = fiber, 0 !== (node.flags & 4098) && (nearestMounted = node.return), fiber = node.return;
          while (fiber);
        }
        return 3 === node.tag ? nearestMounted : null;
      }
      function getSuspenseInstanceFromFiber(fiber) {
        if (13 === fiber.tag) {
          var suspenseState = fiber.memoizedState;
          null === suspenseState && (fiber = fiber.alternate, null !== fiber && (suspenseState = fiber.memoizedState));
          if (null !== suspenseState) return suspenseState.dehydrated;
        }
        return null;
      }
      function getActivityInstanceFromFiber(fiber) {
        if (31 === fiber.tag) {
          var activityState = fiber.memoizedState;
          null === activityState && (fiber = fiber.alternate, null !== fiber && (activityState = fiber.memoizedState));
          if (null !== activityState) return activityState.dehydrated;
        }
        return null;
      }
      function assertIsMounted(fiber) {
        if (getNearestMountedFiber(fiber) !== fiber)
          throw Error(formatProdErrorMessage(188));
      }
      function findCurrentFiberUsingSlowPath(fiber) {
        var alternate = fiber.alternate;
        if (!alternate) {
          alternate = getNearestMountedFiber(fiber);
          if (null === alternate) throw Error(formatProdErrorMessage(188));
          return alternate !== fiber ? null : fiber;
        }
        for (var a = fiber, b = alternate; ; ) {
          var parentA = a.return;
          if (null === parentA) break;
          var parentB = parentA.alternate;
          if (null === parentB) {
            b = parentA.return;
            if (null !== b) {
              a = b;
              continue;
            }
            break;
          }
          if (parentA.child === parentB.child) {
            for (parentB = parentA.child; parentB; ) {
              if (parentB === a) return assertIsMounted(parentA), fiber;
              if (parentB === b) return assertIsMounted(parentA), alternate;
              parentB = parentB.sibling;
            }
            throw Error(formatProdErrorMessage(188));
          }
          if (a.return !== b.return) a = parentA, b = parentB;
          else {
            for (var didFindChild = false, child$0 = parentA.child; child$0; ) {
              if (child$0 === a) {
                didFindChild = true;
                a = parentA;
                b = parentB;
                break;
              }
              if (child$0 === b) {
                didFindChild = true;
                b = parentA;
                a = parentB;
                break;
              }
              child$0 = child$0.sibling;
            }
            if (!didFindChild) {
              for (child$0 = parentB.child; child$0; ) {
                if (child$0 === a) {
                  didFindChild = true;
                  a = parentB;
                  b = parentA;
                  break;
                }
                if (child$0 === b) {
                  didFindChild = true;
                  b = parentB;
                  a = parentA;
                  break;
                }
                child$0 = child$0.sibling;
              }
              if (!didFindChild) throw Error(formatProdErrorMessage(189));
            }
          }
          if (a.alternate !== b) throw Error(formatProdErrorMessage(190));
        }
        if (3 !== a.tag) throw Error(formatProdErrorMessage(188));
        return a.stateNode.current === a ? fiber : alternate;
      }
      function findCurrentHostFiberImpl(node) {
        var tag = node.tag;
        if (5 === tag || 26 === tag || 27 === tag || 6 === tag) return node;
        for (node = node.child; null !== node; ) {
          tag = findCurrentHostFiberImpl(node);
          if (null !== tag) return tag;
          node = node.sibling;
        }
        return null;
      }
      var assign = Object.assign;
      var REACT_LEGACY_ELEMENT_TYPE = /* @__PURE__ */ Symbol.for("react.element");
      var REACT_ELEMENT_TYPE = /* @__PURE__ */ Symbol.for("react.transitional.element");
      var REACT_PORTAL_TYPE = /* @__PURE__ */ Symbol.for("react.portal");
      var REACT_FRAGMENT_TYPE = /* @__PURE__ */ Symbol.for("react.fragment");
      var REACT_STRICT_MODE_TYPE = /* @__PURE__ */ Symbol.for("react.strict_mode");
      var REACT_PROFILER_TYPE = /* @__PURE__ */ Symbol.for("react.profiler");
      var REACT_CONSUMER_TYPE = /* @__PURE__ */ Symbol.for("react.consumer");
      var REACT_CONTEXT_TYPE = /* @__PURE__ */ Symbol.for("react.context");
      var REACT_FORWARD_REF_TYPE = /* @__PURE__ */ Symbol.for("react.forward_ref");
      var REACT_SUSPENSE_TYPE = /* @__PURE__ */ Symbol.for("react.suspense");
      var REACT_SUSPENSE_LIST_TYPE = /* @__PURE__ */ Symbol.for("react.suspense_list");
      var REACT_MEMO_TYPE = /* @__PURE__ */ Symbol.for("react.memo");
      var REACT_LAZY_TYPE = /* @__PURE__ */ Symbol.for("react.lazy");
      var REACT_ACTIVITY_TYPE = /* @__PURE__ */ Symbol.for("react.activity");
      var REACT_MEMO_CACHE_SENTINEL = /* @__PURE__ */ Symbol.for("react.memo_cache_sentinel");
      var MAYBE_ITERATOR_SYMBOL = Symbol.iterator;
      function getIteratorFn(maybeIterable) {
        if (null === maybeIterable || "object" !== typeof maybeIterable) return null;
        maybeIterable = MAYBE_ITERATOR_SYMBOL && maybeIterable[MAYBE_ITERATOR_SYMBOL] || maybeIterable["@@iterator"];
        return "function" === typeof maybeIterable ? maybeIterable : null;
      }
      var REACT_CLIENT_REFERENCE = /* @__PURE__ */ Symbol.for("react.client.reference");
      function getComponentNameFromType(type) {
        if (null == type) return null;
        if ("function" === typeof type)
          return type.$$typeof === REACT_CLIENT_REFERENCE ? null : type.displayName || type.name || null;
        if ("string" === typeof type) return type;
        switch (type) {
          case REACT_FRAGMENT_TYPE:
            return "Fragment";
          case REACT_PROFILER_TYPE:
            return "Profiler";
          case REACT_STRICT_MODE_TYPE:
            return "StrictMode";
          case REACT_SUSPENSE_TYPE:
            return "Suspense";
          case REACT_SUSPENSE_LIST_TYPE:
            return "SuspenseList";
          case REACT_ACTIVITY_TYPE:
            return "Activity";
        }
        if ("object" === typeof type)
          switch (type.$$typeof) {
            case REACT_PORTAL_TYPE:
              return "Portal";
            case REACT_CONTEXT_TYPE:
              return type.displayName || "Context";
            case REACT_CONSUMER_TYPE:
              return (type._context.displayName || "Context") + ".Consumer";
            case REACT_FORWARD_REF_TYPE:
              var innerType = type.render;
              type = type.displayName;
              type || (type = innerType.displayName || innerType.name || "", type = "" !== type ? "ForwardRef(" + type + ")" : "ForwardRef");
              return type;
            case REACT_MEMO_TYPE:
              return innerType = type.displayName || null, null !== innerType ? innerType : getComponentNameFromType(type.type) || "Memo";
            case REACT_LAZY_TYPE:
              innerType = type._payload;
              type = type._init;
              try {
                return getComponentNameFromType(type(innerType));
              } catch (x) {
              }
          }
        return null;
      }
      var isArrayImpl = Array.isArray;
      var ReactSharedInternals = React3.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE;
      var ReactDOMSharedInternals = ReactDOM2.__DOM_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE;
      var sharedNotPendingObject = {
        pending: false,
        data: null,
        method: null,
        action: null
      };
      var valueStack = [];
      var index = -1;
      function createCursor(defaultValue) {
        return { current: defaultValue };
      }
      function pop(cursor) {
        0 > index || (cursor.current = valueStack[index], valueStack[index] = null, index--);
      }
      function push(cursor, value) {
        index++;
        valueStack[index] = cursor.current;
        cursor.current = value;
      }
      var contextStackCursor = createCursor(null);
      var contextFiberStackCursor = createCursor(null);
      var rootInstanceStackCursor = createCursor(null);
      var hostTransitionProviderCursor = createCursor(null);
      function pushHostContainer(fiber, nextRootInstance) {
        push(rootInstanceStackCursor, nextRootInstance);
        push(contextFiberStackCursor, fiber);
        push(contextStackCursor, null);
        switch (nextRootInstance.nodeType) {
          case 9:
          case 11:
            fiber = (fiber = nextRootInstance.documentElement) ? (fiber = fiber.namespaceURI) ? getOwnHostContext(fiber) : 0 : 0;
            break;
          default:
            if (fiber = nextRootInstance.tagName, nextRootInstance = nextRootInstance.namespaceURI)
              nextRootInstance = getOwnHostContext(nextRootInstance), fiber = getChildHostContextProd(nextRootInstance, fiber);
            else
              switch (fiber) {
                case "svg":
                  fiber = 1;
                  break;
                case "math":
                  fiber = 2;
                  break;
                default:
                  fiber = 0;
              }
        }
        pop(contextStackCursor);
        push(contextStackCursor, fiber);
      }
      function popHostContainer() {
        pop(contextStackCursor);
        pop(contextFiberStackCursor);
        pop(rootInstanceStackCursor);
      }
      function pushHostContext(fiber) {
        null !== fiber.memoizedState && push(hostTransitionProviderCursor, fiber);
        var context = contextStackCursor.current;
        var JSCompiler_inline_result = getChildHostContextProd(context, fiber.type);
        context !== JSCompiler_inline_result && (push(contextFiberStackCursor, fiber), push(contextStackCursor, JSCompiler_inline_result));
      }
      function popHostContext(fiber) {
        contextFiberStackCursor.current === fiber && (pop(contextStackCursor), pop(contextFiberStackCursor));
        hostTransitionProviderCursor.current === fiber && (pop(hostTransitionProviderCursor), HostTransitionContext._currentValue = sharedNotPendingObject);
      }
      var prefix;
      var suffix;
      function describeBuiltInComponentFrame(name) {
        if (void 0 === prefix)
          try {
            throw Error();
          } catch (x) {
            var match = x.stack.trim().match(/\n( *(at )?)/);
            prefix = match && match[1] || "";
            suffix = -1 < x.stack.indexOf("\n    at") ? " (<anonymous>)" : -1 < x.stack.indexOf("@") ? "@unknown:0:0" : "";
          }
        return "\n" + prefix + name + suffix;
      }
      var reentry = false;
      function describeNativeComponentFrame(fn, construct) {
        if (!fn || reentry) return "";
        reentry = true;
        var previousPrepareStackTrace = Error.prepareStackTrace;
        Error.prepareStackTrace = void 0;
        try {
          var RunInRootFrame = {
            DetermineComponentFrameRoot: function() {
              try {
                if (construct) {
                  var Fake = function() {
                    throw Error();
                  };
                  Object.defineProperty(Fake.prototype, "props", {
                    set: function() {
                      throw Error();
                    }
                  });
                  if ("object" === typeof Reflect && Reflect.construct) {
                    try {
                      Reflect.construct(Fake, []);
                    } catch (x) {
                      var control = x;
                    }
                    Reflect.construct(fn, [], Fake);
                  } else {
                    try {
                      Fake.call();
                    } catch (x$1) {
                      control = x$1;
                    }
                    fn.call(Fake.prototype);
                  }
                } else {
                  try {
                    throw Error();
                  } catch (x$2) {
                    control = x$2;
                  }
                  (Fake = fn()) && "function" === typeof Fake.catch && Fake.catch(function() {
                  });
                }
              } catch (sample) {
                if (sample && control && "string" === typeof sample.stack)
                  return [sample.stack, control.stack];
              }
              return [null, null];
            }
          };
          RunInRootFrame.DetermineComponentFrameRoot.displayName = "DetermineComponentFrameRoot";
          var namePropDescriptor = Object.getOwnPropertyDescriptor(
            RunInRootFrame.DetermineComponentFrameRoot,
            "name"
          );
          namePropDescriptor && namePropDescriptor.configurable && Object.defineProperty(
            RunInRootFrame.DetermineComponentFrameRoot,
            "name",
            { value: "DetermineComponentFrameRoot" }
          );
          var _RunInRootFrame$Deter = RunInRootFrame.DetermineComponentFrameRoot(), sampleStack = _RunInRootFrame$Deter[0], controlStack = _RunInRootFrame$Deter[1];
          if (sampleStack && controlStack) {
            var sampleLines = sampleStack.split("\n"), controlLines = controlStack.split("\n");
            for (namePropDescriptor = RunInRootFrame = 0; RunInRootFrame < sampleLines.length && !sampleLines[RunInRootFrame].includes("DetermineComponentFrameRoot"); )
              RunInRootFrame++;
            for (; namePropDescriptor < controlLines.length && !controlLines[namePropDescriptor].includes(
              "DetermineComponentFrameRoot"
            ); )
              namePropDescriptor++;
            if (RunInRootFrame === sampleLines.length || namePropDescriptor === controlLines.length)
              for (RunInRootFrame = sampleLines.length - 1, namePropDescriptor = controlLines.length - 1; 1 <= RunInRootFrame && 0 <= namePropDescriptor && sampleLines[RunInRootFrame] !== controlLines[namePropDescriptor]; )
                namePropDescriptor--;
            for (; 1 <= RunInRootFrame && 0 <= namePropDescriptor; RunInRootFrame--, namePropDescriptor--)
              if (sampleLines[RunInRootFrame] !== controlLines[namePropDescriptor]) {
                if (1 !== RunInRootFrame || 1 !== namePropDescriptor) {
                  do
                    if (RunInRootFrame--, namePropDescriptor--, 0 > namePropDescriptor || sampleLines[RunInRootFrame] !== controlLines[namePropDescriptor]) {
                      var frame = "\n" + sampleLines[RunInRootFrame].replace(" at new ", " at ");
                      fn.displayName && frame.includes("<anonymous>") && (frame = frame.replace("<anonymous>", fn.displayName));
                      return frame;
                    }
                  while (1 <= RunInRootFrame && 0 <= namePropDescriptor);
                }
                break;
              }
          }
        } finally {
          reentry = false, Error.prepareStackTrace = previousPrepareStackTrace;
        }
        return (previousPrepareStackTrace = fn ? fn.displayName || fn.name : "") ? describeBuiltInComponentFrame(previousPrepareStackTrace) : "";
      }
      function describeFiber(fiber, childFiber) {
        switch (fiber.tag) {
          case 26:
          case 27:
          case 5:
            return describeBuiltInComponentFrame(fiber.type);
          case 16:
            return describeBuiltInComponentFrame("Lazy");
          case 13:
            return fiber.child !== childFiber && null !== childFiber ? describeBuiltInComponentFrame("Suspense Fallback") : describeBuiltInComponentFrame("Suspense");
          case 19:
            return describeBuiltInComponentFrame("SuspenseList");
          case 0:
          case 15:
            return describeNativeComponentFrame(fiber.type, false);
          case 11:
            return describeNativeComponentFrame(fiber.type.render, false);
          case 1:
            return describeNativeComponentFrame(fiber.type, true);
          case 31:
            return describeBuiltInComponentFrame("Activity");
          default:
            return "";
        }
      }
      function getStackByFiberInDevAndProd(workInProgress2) {
        try {
          var info = "", previous = null;
          do
            info += describeFiber(workInProgress2, previous), previous = workInProgress2, workInProgress2 = workInProgress2.return;
          while (workInProgress2);
          return info;
        } catch (x) {
          return "\nError generating stack: " + x.message + "\n" + x.stack;
        }
      }
      var hasOwnProperty = Object.prototype.hasOwnProperty;
      var scheduleCallback$3 = Scheduler.unstable_scheduleCallback;
      var cancelCallback$1 = Scheduler.unstable_cancelCallback;
      var shouldYield = Scheduler.unstable_shouldYield;
      var requestPaint = Scheduler.unstable_requestPaint;
      var now = Scheduler.unstable_now;
      var getCurrentPriorityLevel = Scheduler.unstable_getCurrentPriorityLevel;
      var ImmediatePriority = Scheduler.unstable_ImmediatePriority;
      var UserBlockingPriority = Scheduler.unstable_UserBlockingPriority;
      var NormalPriority$1 = Scheduler.unstable_NormalPriority;
      var LowPriority = Scheduler.unstable_LowPriority;
      var IdlePriority = Scheduler.unstable_IdlePriority;
      var log$1 = Scheduler.log;
      var unstable_setDisableYieldValue = Scheduler.unstable_setDisableYieldValue;
      var rendererID = null;
      var injectedHook = null;
      function setIsStrictModeForDevtools(newIsStrictMode) {
        "function" === typeof log$1 && unstable_setDisableYieldValue(newIsStrictMode);
        if (injectedHook && "function" === typeof injectedHook.setStrictMode)
          try {
            injectedHook.setStrictMode(rendererID, newIsStrictMode);
          } catch (err) {
          }
      }
      var clz32 = Math.clz32 ? Math.clz32 : clz32Fallback;
      var log = Math.log;
      var LN2 = Math.LN2;
      function clz32Fallback(x) {
        x >>>= 0;
        return 0 === x ? 32 : 31 - (log(x) / LN2 | 0) | 0;
      }
      var nextTransitionUpdateLane = 256;
      var nextTransitionDeferredLane = 262144;
      var nextRetryLane = 4194304;
      function getHighestPriorityLanes(lanes) {
        var pendingSyncLanes = lanes & 42;
        if (0 !== pendingSyncLanes) return pendingSyncLanes;
        switch (lanes & -lanes) {
          case 1:
            return 1;
          case 2:
            return 2;
          case 4:
            return 4;
          case 8:
            return 8;
          case 16:
            return 16;
          case 32:
            return 32;
          case 64:
            return 64;
          case 128:
            return 128;
          case 256:
          case 512:
          case 1024:
          case 2048:
          case 4096:
          case 8192:
          case 16384:
          case 32768:
          case 65536:
          case 131072:
            return lanes & 261888;
          case 262144:
          case 524288:
          case 1048576:
          case 2097152:
            return lanes & 3932160;
          case 4194304:
          case 8388608:
          case 16777216:
          case 33554432:
            return lanes & 62914560;
          case 67108864:
            return 67108864;
          case 134217728:
            return 134217728;
          case 268435456:
            return 268435456;
          case 536870912:
            return 536870912;
          case 1073741824:
            return 0;
          default:
            return lanes;
        }
      }
      function getNextLanes(root2, wipLanes, rootHasPendingCommit) {
        var pendingLanes = root2.pendingLanes;
        if (0 === pendingLanes) return 0;
        var nextLanes = 0, suspendedLanes = root2.suspendedLanes, pingedLanes = root2.pingedLanes;
        root2 = root2.warmLanes;
        var nonIdlePendingLanes = pendingLanes & 134217727;
        0 !== nonIdlePendingLanes ? (pendingLanes = nonIdlePendingLanes & ~suspendedLanes, 0 !== pendingLanes ? nextLanes = getHighestPriorityLanes(pendingLanes) : (pingedLanes &= nonIdlePendingLanes, 0 !== pingedLanes ? nextLanes = getHighestPriorityLanes(pingedLanes) : rootHasPendingCommit || (rootHasPendingCommit = nonIdlePendingLanes & ~root2, 0 !== rootHasPendingCommit && (nextLanes = getHighestPriorityLanes(rootHasPendingCommit))))) : (nonIdlePendingLanes = pendingLanes & ~suspendedLanes, 0 !== nonIdlePendingLanes ? nextLanes = getHighestPriorityLanes(nonIdlePendingLanes) : 0 !== pingedLanes ? nextLanes = getHighestPriorityLanes(pingedLanes) : rootHasPendingCommit || (rootHasPendingCommit = pendingLanes & ~root2, 0 !== rootHasPendingCommit && (nextLanes = getHighestPriorityLanes(rootHasPendingCommit))));
        return 0 === nextLanes ? 0 : 0 !== wipLanes && wipLanes !== nextLanes && 0 === (wipLanes & suspendedLanes) && (suspendedLanes = nextLanes & -nextLanes, rootHasPendingCommit = wipLanes & -wipLanes, suspendedLanes >= rootHasPendingCommit || 32 === suspendedLanes && 0 !== (rootHasPendingCommit & 4194048)) ? wipLanes : nextLanes;
      }
      function checkIfRootIsPrerendering(root2, renderLanes2) {
        return 0 === (root2.pendingLanes & ~(root2.suspendedLanes & ~root2.pingedLanes) & renderLanes2);
      }
      function computeExpirationTime(lane, currentTime) {
        switch (lane) {
          case 1:
          case 2:
          case 4:
          case 8:
          case 64:
            return currentTime + 250;
          case 16:
          case 32:
          case 128:
          case 256:
          case 512:
          case 1024:
          case 2048:
          case 4096:
          case 8192:
          case 16384:
          case 32768:
          case 65536:
          case 131072:
          case 262144:
          case 524288:
          case 1048576:
          case 2097152:
            return currentTime + 5e3;
          case 4194304:
          case 8388608:
          case 16777216:
          case 33554432:
            return -1;
          case 67108864:
          case 134217728:
          case 268435456:
          case 536870912:
          case 1073741824:
            return -1;
          default:
            return -1;
        }
      }
      function claimNextRetryLane() {
        var lane = nextRetryLane;
        nextRetryLane <<= 1;
        0 === (nextRetryLane & 62914560) && (nextRetryLane = 4194304);
        return lane;
      }
      function createLaneMap(initial) {
        for (var laneMap = [], i = 0; 31 > i; i++) laneMap.push(initial);
        return laneMap;
      }
      function markRootUpdated$1(root2, updateLane) {
        root2.pendingLanes |= updateLane;
        268435456 !== updateLane && (root2.suspendedLanes = 0, root2.pingedLanes = 0, root2.warmLanes = 0);
      }
      function markRootFinished(root2, finishedLanes, remainingLanes, spawnedLane, updatedLanes, suspendedRetryLanes) {
        var previouslyPendingLanes = root2.pendingLanes;
        root2.pendingLanes = remainingLanes;
        root2.suspendedLanes = 0;
        root2.pingedLanes = 0;
        root2.warmLanes = 0;
        root2.expiredLanes &= remainingLanes;
        root2.entangledLanes &= remainingLanes;
        root2.errorRecoveryDisabledLanes &= remainingLanes;
        root2.shellSuspendCounter = 0;
        var entanglements = root2.entanglements, expirationTimes = root2.expirationTimes, hiddenUpdates = root2.hiddenUpdates;
        for (remainingLanes = previouslyPendingLanes & ~remainingLanes; 0 < remainingLanes; ) {
          var index$7 = 31 - clz32(remainingLanes), lane = 1 << index$7;
          entanglements[index$7] = 0;
          expirationTimes[index$7] = -1;
          var hiddenUpdatesForLane = hiddenUpdates[index$7];
          if (null !== hiddenUpdatesForLane)
            for (hiddenUpdates[index$7] = null, index$7 = 0; index$7 < hiddenUpdatesForLane.length; index$7++) {
              var update = hiddenUpdatesForLane[index$7];
              null !== update && (update.lane &= -536870913);
            }
          remainingLanes &= ~lane;
        }
        0 !== spawnedLane && markSpawnedDeferredLane(root2, spawnedLane, 0);
        0 !== suspendedRetryLanes && 0 === updatedLanes && 0 !== root2.tag && (root2.suspendedLanes |= suspendedRetryLanes & ~(previouslyPendingLanes & ~finishedLanes));
      }
      function markSpawnedDeferredLane(root2, spawnedLane, entangledLanes) {
        root2.pendingLanes |= spawnedLane;
        root2.suspendedLanes &= ~spawnedLane;
        var spawnedLaneIndex = 31 - clz32(spawnedLane);
        root2.entangledLanes |= spawnedLane;
        root2.entanglements[spawnedLaneIndex] = root2.entanglements[spawnedLaneIndex] | 1073741824 | entangledLanes & 261930;
      }
      function markRootEntangled(root2, entangledLanes) {
        var rootEntangledLanes = root2.entangledLanes |= entangledLanes;
        for (root2 = root2.entanglements; rootEntangledLanes; ) {
          var index$8 = 31 - clz32(rootEntangledLanes), lane = 1 << index$8;
          lane & entangledLanes | root2[index$8] & entangledLanes && (root2[index$8] |= entangledLanes);
          rootEntangledLanes &= ~lane;
        }
      }
      function getBumpedLaneForHydration(root2, renderLanes2) {
        var renderLane = renderLanes2 & -renderLanes2;
        renderLane = 0 !== (renderLane & 42) ? 1 : getBumpedLaneForHydrationByLane(renderLane);
        return 0 !== (renderLane & (root2.suspendedLanes | renderLanes2)) ? 0 : renderLane;
      }
      function getBumpedLaneForHydrationByLane(lane) {
        switch (lane) {
          case 2:
            lane = 1;
            break;
          case 8:
            lane = 4;
            break;
          case 32:
            lane = 16;
            break;
          case 256:
          case 512:
          case 1024:
          case 2048:
          case 4096:
          case 8192:
          case 16384:
          case 32768:
          case 65536:
          case 131072:
          case 262144:
          case 524288:
          case 1048576:
          case 2097152:
          case 4194304:
          case 8388608:
          case 16777216:
          case 33554432:
            lane = 128;
            break;
          case 268435456:
            lane = 134217728;
            break;
          default:
            lane = 0;
        }
        return lane;
      }
      function lanesToEventPriority(lanes) {
        lanes &= -lanes;
        return 2 < lanes ? 8 < lanes ? 0 !== (lanes & 134217727) ? 32 : 268435456 : 8 : 2;
      }
      function resolveUpdatePriority() {
        var updatePriority = ReactDOMSharedInternals.p;
        if (0 !== updatePriority) return updatePriority;
        updatePriority = window.event;
        return void 0 === updatePriority ? 32 : getEventPriority(updatePriority.type);
      }
      function runWithPriority(priority, fn) {
        var previousPriority = ReactDOMSharedInternals.p;
        try {
          return ReactDOMSharedInternals.p = priority, fn();
        } finally {
          ReactDOMSharedInternals.p = previousPriority;
        }
      }
      var randomKey = Math.random().toString(36).slice(2);
      var internalInstanceKey = "__reactFiber$" + randomKey;
      var internalPropsKey = "__reactProps$" + randomKey;
      var internalContainerInstanceKey = "__reactContainer$" + randomKey;
      var internalEventHandlersKey = "__reactEvents$" + randomKey;
      var internalEventHandlerListenersKey = "__reactListeners$" + randomKey;
      var internalEventHandlesSetKey = "__reactHandles$" + randomKey;
      var internalRootNodeResourcesKey = "__reactResources$" + randomKey;
      var internalHoistableMarker = "__reactMarker$" + randomKey;
      function detachDeletedInstance(node) {
        delete node[internalInstanceKey];
        delete node[internalPropsKey];
        delete node[internalEventHandlersKey];
        delete node[internalEventHandlerListenersKey];
        delete node[internalEventHandlesSetKey];
      }
      function getClosestInstanceFromNode(targetNode) {
        var targetInst = targetNode[internalInstanceKey];
        if (targetInst) return targetInst;
        for (var parentNode = targetNode.parentNode; parentNode; ) {
          if (targetInst = parentNode[internalContainerInstanceKey] || parentNode[internalInstanceKey]) {
            parentNode = targetInst.alternate;
            if (null !== targetInst.child || null !== parentNode && null !== parentNode.child)
              for (targetNode = getParentHydrationBoundary(targetNode); null !== targetNode; ) {
                if (parentNode = targetNode[internalInstanceKey]) return parentNode;
                targetNode = getParentHydrationBoundary(targetNode);
              }
            return targetInst;
          }
          targetNode = parentNode;
          parentNode = targetNode.parentNode;
        }
        return null;
      }
      function getInstanceFromNode(node) {
        if (node = node[internalInstanceKey] || node[internalContainerInstanceKey]) {
          var tag = node.tag;
          if (5 === tag || 6 === tag || 13 === tag || 31 === tag || 26 === tag || 27 === tag || 3 === tag)
            return node;
        }
        return null;
      }
      function getNodeFromInstance(inst) {
        var tag = inst.tag;
        if (5 === tag || 26 === tag || 27 === tag || 6 === tag) return inst.stateNode;
        throw Error(formatProdErrorMessage(33));
      }
      function getResourcesFromRoot(root2) {
        var resources = root2[internalRootNodeResourcesKey];
        resources || (resources = root2[internalRootNodeResourcesKey] = { hoistableStyles: /* @__PURE__ */ new Map(), hoistableScripts: /* @__PURE__ */ new Map() });
        return resources;
      }
      function markNodeAsHoistable(node) {
        node[internalHoistableMarker] = true;
      }
      var allNativeEvents = /* @__PURE__ */ new Set();
      var registrationNameDependencies = {};
      function registerTwoPhaseEvent(registrationName, dependencies) {
        registerDirectEvent(registrationName, dependencies);
        registerDirectEvent(registrationName + "Capture", dependencies);
      }
      function registerDirectEvent(registrationName, dependencies) {
        registrationNameDependencies[registrationName] = dependencies;
        for (registrationName = 0; registrationName < dependencies.length; registrationName++)
          allNativeEvents.add(dependencies[registrationName]);
      }
      var VALID_ATTRIBUTE_NAME_REGEX = RegExp(
        "^[:A-Z_a-z\\u00C0-\\u00D6\\u00D8-\\u00F6\\u00F8-\\u02FF\\u0370-\\u037D\\u037F-\\u1FFF\\u200C-\\u200D\\u2070-\\u218F\\u2C00-\\u2FEF\\u3001-\\uD7FF\\uF900-\\uFDCF\\uFDF0-\\uFFFD][:A-Z_a-z\\u00C0-\\u00D6\\u00D8-\\u00F6\\u00F8-\\u02FF\\u0370-\\u037D\\u037F-\\u1FFF\\u200C-\\u200D\\u2070-\\u218F\\u2C00-\\u2FEF\\u3001-\\uD7FF\\uF900-\\uFDCF\\uFDF0-\\uFFFD\\-.0-9\\u00B7\\u0300-\\u036F\\u203F-\\u2040]*$"
      );
      var illegalAttributeNameCache = {};
      var validatedAttributeNameCache = {};
      function isAttributeNameSafe(attributeName) {
        if (hasOwnProperty.call(validatedAttributeNameCache, attributeName))
          return true;
        if (hasOwnProperty.call(illegalAttributeNameCache, attributeName)) return false;
        if (VALID_ATTRIBUTE_NAME_REGEX.test(attributeName))
          return validatedAttributeNameCache[attributeName] = true;
        illegalAttributeNameCache[attributeName] = true;
        return false;
      }
      function setValueForAttribute(node, name, value) {
        if (isAttributeNameSafe(name))
          if (null === value) node.removeAttribute(name);
          else {
            switch (typeof value) {
              case "undefined":
              case "function":
              case "symbol":
                node.removeAttribute(name);
                return;
              case "boolean":
                var prefix$10 = name.toLowerCase().slice(0, 5);
                if ("data-" !== prefix$10 && "aria-" !== prefix$10) {
                  node.removeAttribute(name);
                  return;
                }
            }
            node.setAttribute(name, "" + value);
          }
      }
      function setValueForKnownAttribute(node, name, value) {
        if (null === value) node.removeAttribute(name);
        else {
          switch (typeof value) {
            case "undefined":
            case "function":
            case "symbol":
            case "boolean":
              node.removeAttribute(name);
              return;
          }
          node.setAttribute(name, "" + value);
        }
      }
      function setValueForNamespacedAttribute(node, namespace, name, value) {
        if (null === value) node.removeAttribute(name);
        else {
          switch (typeof value) {
            case "undefined":
            case "function":
            case "symbol":
            case "boolean":
              node.removeAttribute(name);
              return;
          }
          node.setAttributeNS(namespace, name, "" + value);
        }
      }
      function getToStringValue(value) {
        switch (typeof value) {
          case "bigint":
          case "boolean":
          case "number":
          case "string":
          case "undefined":
            return value;
          case "object":
            return value;
          default:
            return "";
        }
      }
      function isCheckable(elem) {
        var type = elem.type;
        return (elem = elem.nodeName) && "input" === elem.toLowerCase() && ("checkbox" === type || "radio" === type);
      }
      function trackValueOnNode(node, valueField, currentValue) {
        var descriptor = Object.getOwnPropertyDescriptor(
          node.constructor.prototype,
          valueField
        );
        if (!node.hasOwnProperty(valueField) && "undefined" !== typeof descriptor && "function" === typeof descriptor.get && "function" === typeof descriptor.set) {
          var get = descriptor.get, set = descriptor.set;
          Object.defineProperty(node, valueField, {
            configurable: true,
            get: function() {
              return get.call(this);
            },
            set: function(value) {
              currentValue = "" + value;
              set.call(this, value);
            }
          });
          Object.defineProperty(node, valueField, {
            enumerable: descriptor.enumerable
          });
          return {
            getValue: function() {
              return currentValue;
            },
            setValue: function(value) {
              currentValue = "" + value;
            },
            stopTracking: function() {
              node._valueTracker = null;
              delete node[valueField];
            }
          };
        }
      }
      function track(node) {
        if (!node._valueTracker) {
          var valueField = isCheckable(node) ? "checked" : "value";
          node._valueTracker = trackValueOnNode(
            node,
            valueField,
            "" + node[valueField]
          );
        }
      }
      function updateValueIfChanged(node) {
        if (!node) return false;
        var tracker = node._valueTracker;
        if (!tracker) return true;
        var lastValue = tracker.getValue();
        var value = "";
        node && (value = isCheckable(node) ? node.checked ? "true" : "false" : node.value);
        node = value;
        return node !== lastValue ? (tracker.setValue(node), true) : false;
      }
      function getActiveElement(doc) {
        doc = doc || ("undefined" !== typeof document ? document : void 0);
        if ("undefined" === typeof doc) return null;
        try {
          return doc.activeElement || doc.body;
        } catch (e) {
          return doc.body;
        }
      }
      var escapeSelectorAttributeValueInsideDoubleQuotesRegex = /[\n"\\]/g;
      function escapeSelectorAttributeValueInsideDoubleQuotes(value) {
        return value.replace(
          escapeSelectorAttributeValueInsideDoubleQuotesRegex,
          function(ch) {
            return "\\" + ch.charCodeAt(0).toString(16) + " ";
          }
        );
      }
      function updateInput(element, value, defaultValue, lastDefaultValue, checked, defaultChecked, type, name) {
        element.name = "";
        null != type && "function" !== typeof type && "symbol" !== typeof type && "boolean" !== typeof type ? element.type = type : element.removeAttribute("type");
        if (null != value)
          if ("number" === type) {
            if (0 === value && "" === element.value || element.value != value)
              element.value = "" + getToStringValue(value);
          } else
            element.value !== "" + getToStringValue(value) && (element.value = "" + getToStringValue(value));
        else
          "submit" !== type && "reset" !== type || element.removeAttribute("value");
        null != value ? setDefaultValue(element, type, getToStringValue(value)) : null != defaultValue ? setDefaultValue(element, type, getToStringValue(defaultValue)) : null != lastDefaultValue && element.removeAttribute("value");
        null == checked && null != defaultChecked && (element.defaultChecked = !!defaultChecked);
        null != checked && (element.checked = checked && "function" !== typeof checked && "symbol" !== typeof checked);
        null != name && "function" !== typeof name && "symbol" !== typeof name && "boolean" !== typeof name ? element.name = "" + getToStringValue(name) : element.removeAttribute("name");
      }
      function initInput(element, value, defaultValue, checked, defaultChecked, type, name, isHydrating2) {
        null != type && "function" !== typeof type && "symbol" !== typeof type && "boolean" !== typeof type && (element.type = type);
        if (null != value || null != defaultValue) {
          if (!("submit" !== type && "reset" !== type || void 0 !== value && null !== value)) {
            track(element);
            return;
          }
          defaultValue = null != defaultValue ? "" + getToStringValue(defaultValue) : "";
          value = null != value ? "" + getToStringValue(value) : defaultValue;
          isHydrating2 || value === element.value || (element.value = value);
          element.defaultValue = value;
        }
        checked = null != checked ? checked : defaultChecked;
        checked = "function" !== typeof checked && "symbol" !== typeof checked && !!checked;
        element.checked = isHydrating2 ? element.checked : !!checked;
        element.defaultChecked = !!checked;
        null != name && "function" !== typeof name && "symbol" !== typeof name && "boolean" !== typeof name && (element.name = name);
        track(element);
      }
      function setDefaultValue(node, type, value) {
        "number" === type && getActiveElement(node.ownerDocument) === node || node.defaultValue === "" + value || (node.defaultValue = "" + value);
      }
      function updateOptions(node, multiple, propValue, setDefaultSelected) {
        node = node.options;
        if (multiple) {
          multiple = {};
          for (var i = 0; i < propValue.length; i++)
            multiple["$" + propValue[i]] = true;
          for (propValue = 0; propValue < node.length; propValue++)
            i = multiple.hasOwnProperty("$" + node[propValue].value), node[propValue].selected !== i && (node[propValue].selected = i), i && setDefaultSelected && (node[propValue].defaultSelected = true);
        } else {
          propValue = "" + getToStringValue(propValue);
          multiple = null;
          for (i = 0; i < node.length; i++) {
            if (node[i].value === propValue) {
              node[i].selected = true;
              setDefaultSelected && (node[i].defaultSelected = true);
              return;
            }
            null !== multiple || node[i].disabled || (multiple = node[i]);
          }
          null !== multiple && (multiple.selected = true);
        }
      }
      function updateTextarea(element, value, defaultValue) {
        if (null != value && (value = "" + getToStringValue(value), value !== element.value && (element.value = value), null == defaultValue)) {
          element.defaultValue !== value && (element.defaultValue = value);
          return;
        }
        element.defaultValue = null != defaultValue ? "" + getToStringValue(defaultValue) : "";
      }
      function initTextarea(element, value, defaultValue, children) {
        if (null == value) {
          if (null != children) {
            if (null != defaultValue) throw Error(formatProdErrorMessage(92));
            if (isArrayImpl(children)) {
              if (1 < children.length) throw Error(formatProdErrorMessage(93));
              children = children[0];
            }
            defaultValue = children;
          }
          null == defaultValue && (defaultValue = "");
          value = defaultValue;
        }
        defaultValue = getToStringValue(value);
        element.defaultValue = defaultValue;
        children = element.textContent;
        children === defaultValue && "" !== children && null !== children && (element.value = children);
        track(element);
      }
      function setTextContent(node, text) {
        if (text) {
          var firstChild = node.firstChild;
          if (firstChild && firstChild === node.lastChild && 3 === firstChild.nodeType) {
            firstChild.nodeValue = text;
            return;
          }
        }
        node.textContent = text;
      }
      var unitlessNumbers = new Set(
        "animationIterationCount aspectRatio borderImageOutset borderImageSlice borderImageWidth boxFlex boxFlexGroup boxOrdinalGroup columnCount columns flex flexGrow flexPositive flexShrink flexNegative flexOrder gridArea gridRow gridRowEnd gridRowSpan gridRowStart gridColumn gridColumnEnd gridColumnSpan gridColumnStart fontWeight lineClamp lineHeight opacity order orphans scale tabSize widows zIndex zoom fillOpacity floodOpacity stopOpacity strokeDasharray strokeDashoffset strokeMiterlimit strokeOpacity strokeWidth MozAnimationIterationCount MozBoxFlex MozBoxFlexGroup MozLineClamp msAnimationIterationCount msFlex msZoom msFlexGrow msFlexNegative msFlexOrder msFlexPositive msFlexShrink msGridColumn msGridColumnSpan msGridRow msGridRowSpan WebkitAnimationIterationCount WebkitBoxFlex WebKitBoxFlexGroup WebkitBoxOrdinalGroup WebkitColumnCount WebkitColumns WebkitFlex WebkitFlexGrow WebkitFlexPositive WebkitFlexShrink WebkitLineClamp".split(
          " "
        )
      );
      function setValueForStyle(style2, styleName, value) {
        var isCustomProperty = 0 === styleName.indexOf("--");
        null == value || "boolean" === typeof value || "" === value ? isCustomProperty ? style2.setProperty(styleName, "") : "float" === styleName ? style2.cssFloat = "" : style2[styleName] = "" : isCustomProperty ? style2.setProperty(styleName, value) : "number" !== typeof value || 0 === value || unitlessNumbers.has(styleName) ? "float" === styleName ? style2.cssFloat = value : style2[styleName] = ("" + value).trim() : style2[styleName] = value + "px";
      }
      function setValueForStyles(node, styles2, prevStyles) {
        if (null != styles2 && "object" !== typeof styles2)
          throw Error(formatProdErrorMessage(62));
        node = node.style;
        if (null != prevStyles) {
          for (var styleName in prevStyles)
            !prevStyles.hasOwnProperty(styleName) || null != styles2 && styles2.hasOwnProperty(styleName) || (0 === styleName.indexOf("--") ? node.setProperty(styleName, "") : "float" === styleName ? node.cssFloat = "" : node[styleName] = "");
          for (var styleName$16 in styles2)
            styleName = styles2[styleName$16], styles2.hasOwnProperty(styleName$16) && prevStyles[styleName$16] !== styleName && setValueForStyle(node, styleName$16, styleName);
        } else
          for (var styleName$17 in styles2)
            styles2.hasOwnProperty(styleName$17) && setValueForStyle(node, styleName$17, styles2[styleName$17]);
      }
      function isCustomElement(tagName) {
        if (-1 === tagName.indexOf("-")) return false;
        switch (tagName) {
          case "annotation-xml":
          case "color-profile":
          case "font-face":
          case "font-face-src":
          case "font-face-uri":
          case "font-face-format":
          case "font-face-name":
          case "missing-glyph":
            return false;
          default:
            return true;
        }
      }
      var aliases = /* @__PURE__ */ new Map([
        ["acceptCharset", "accept-charset"],
        ["htmlFor", "for"],
        ["httpEquiv", "http-equiv"],
        ["crossOrigin", "crossorigin"],
        ["accentHeight", "accent-height"],
        ["alignmentBaseline", "alignment-baseline"],
        ["arabicForm", "arabic-form"],
        ["baselineShift", "baseline-shift"],
        ["capHeight", "cap-height"],
        ["clipPath", "clip-path"],
        ["clipRule", "clip-rule"],
        ["colorInterpolation", "color-interpolation"],
        ["colorInterpolationFilters", "color-interpolation-filters"],
        ["colorProfile", "color-profile"],
        ["colorRendering", "color-rendering"],
        ["dominantBaseline", "dominant-baseline"],
        ["enableBackground", "enable-background"],
        ["fillOpacity", "fill-opacity"],
        ["fillRule", "fill-rule"],
        ["floodColor", "flood-color"],
        ["floodOpacity", "flood-opacity"],
        ["fontFamily", "font-family"],
        ["fontSize", "font-size"],
        ["fontSizeAdjust", "font-size-adjust"],
        ["fontStretch", "font-stretch"],
        ["fontStyle", "font-style"],
        ["fontVariant", "font-variant"],
        ["fontWeight", "font-weight"],
        ["glyphName", "glyph-name"],
        ["glyphOrientationHorizontal", "glyph-orientation-horizontal"],
        ["glyphOrientationVertical", "glyph-orientation-vertical"],
        ["horizAdvX", "horiz-adv-x"],
        ["horizOriginX", "horiz-origin-x"],
        ["imageRendering", "image-rendering"],
        ["letterSpacing", "letter-spacing"],
        ["lightingColor", "lighting-color"],
        ["markerEnd", "marker-end"],
        ["markerMid", "marker-mid"],
        ["markerStart", "marker-start"],
        ["overlinePosition", "overline-position"],
        ["overlineThickness", "overline-thickness"],
        ["paintOrder", "paint-order"],
        ["panose-1", "panose-1"],
        ["pointerEvents", "pointer-events"],
        ["renderingIntent", "rendering-intent"],
        ["shapeRendering", "shape-rendering"],
        ["stopColor", "stop-color"],
        ["stopOpacity", "stop-opacity"],
        ["strikethroughPosition", "strikethrough-position"],
        ["strikethroughThickness", "strikethrough-thickness"],
        ["strokeDasharray", "stroke-dasharray"],
        ["strokeDashoffset", "stroke-dashoffset"],
        ["strokeLinecap", "stroke-linecap"],
        ["strokeLinejoin", "stroke-linejoin"],
        ["strokeMiterlimit", "stroke-miterlimit"],
        ["strokeOpacity", "stroke-opacity"],
        ["strokeWidth", "stroke-width"],
        ["textAnchor", "text-anchor"],
        ["textDecoration", "text-decoration"],
        ["textRendering", "text-rendering"],
        ["transformOrigin", "transform-origin"],
        ["underlinePosition", "underline-position"],
        ["underlineThickness", "underline-thickness"],
        ["unicodeBidi", "unicode-bidi"],
        ["unicodeRange", "unicode-range"],
        ["unitsPerEm", "units-per-em"],
        ["vAlphabetic", "v-alphabetic"],
        ["vHanging", "v-hanging"],
        ["vIdeographic", "v-ideographic"],
        ["vMathematical", "v-mathematical"],
        ["vectorEffect", "vector-effect"],
        ["vertAdvY", "vert-adv-y"],
        ["vertOriginX", "vert-origin-x"],
        ["vertOriginY", "vert-origin-y"],
        ["wordSpacing", "word-spacing"],
        ["writingMode", "writing-mode"],
        ["xmlnsXlink", "xmlns:xlink"],
        ["xHeight", "x-height"]
      ]);
      var isJavaScriptProtocol = /^[\u0000-\u001F ]*j[\r\n\t]*a[\r\n\t]*v[\r\n\t]*a[\r\n\t]*s[\r\n\t]*c[\r\n\t]*r[\r\n\t]*i[\r\n\t]*p[\r\n\t]*t[\r\n\t]*:/i;
      function sanitizeURL(url) {
        return isJavaScriptProtocol.test("" + url) ? "javascript:throw new Error('React has blocked a javascript: URL as a security precaution.')" : url;
      }
      function noop$1() {
      }
      var currentReplayingEvent = null;
      function getEventTarget(nativeEvent) {
        nativeEvent = nativeEvent.target || nativeEvent.srcElement || window;
        nativeEvent.correspondingUseElement && (nativeEvent = nativeEvent.correspondingUseElement);
        return 3 === nativeEvent.nodeType ? nativeEvent.parentNode : nativeEvent;
      }
      var restoreTarget = null;
      var restoreQueue = null;
      function restoreStateOfTarget(target) {
        var internalInstance = getInstanceFromNode(target);
        if (internalInstance && (target = internalInstance.stateNode)) {
          var props = target[internalPropsKey] || null;
          a: switch (target = internalInstance.stateNode, internalInstance.type) {
            case "input":
              updateInput(
                target,
                props.value,
                props.defaultValue,
                props.defaultValue,
                props.checked,
                props.defaultChecked,
                props.type,
                props.name
              );
              internalInstance = props.name;
              if ("radio" === props.type && null != internalInstance) {
                for (props = target; props.parentNode; ) props = props.parentNode;
                props = props.querySelectorAll(
                  'input[name="' + escapeSelectorAttributeValueInsideDoubleQuotes(
                    "" + internalInstance
                  ) + '"][type="radio"]'
                );
                for (internalInstance = 0; internalInstance < props.length; internalInstance++) {
                  var otherNode = props[internalInstance];
                  if (otherNode !== target && otherNode.form === target.form) {
                    var otherProps = otherNode[internalPropsKey] || null;
                    if (!otherProps) throw Error(formatProdErrorMessage(90));
                    updateInput(
                      otherNode,
                      otherProps.value,
                      otherProps.defaultValue,
                      otherProps.defaultValue,
                      otherProps.checked,
                      otherProps.defaultChecked,
                      otherProps.type,
                      otherProps.name
                    );
                  }
                }
                for (internalInstance = 0; internalInstance < props.length; internalInstance++)
                  otherNode = props[internalInstance], otherNode.form === target.form && updateValueIfChanged(otherNode);
              }
              break a;
            case "textarea":
              updateTextarea(target, props.value, props.defaultValue);
              break a;
            case "select":
              internalInstance = props.value, null != internalInstance && updateOptions(target, !!props.multiple, internalInstance, false);
          }
        }
      }
      var isInsideEventHandler = false;
      function batchedUpdates$1(fn, a, b) {
        if (isInsideEventHandler) return fn(a, b);
        isInsideEventHandler = true;
        try {
          var JSCompiler_inline_result = fn(a);
          return JSCompiler_inline_result;
        } finally {
          if (isInsideEventHandler = false, null !== restoreTarget || null !== restoreQueue) {
            if (flushSyncWork$1(), restoreTarget && (a = restoreTarget, fn = restoreQueue, restoreQueue = restoreTarget = null, restoreStateOfTarget(a), fn))
              for (a = 0; a < fn.length; a++) restoreStateOfTarget(fn[a]);
          }
        }
      }
      function getListener(inst, registrationName) {
        var stateNode = inst.stateNode;
        if (null === stateNode) return null;
        var props = stateNode[internalPropsKey] || null;
        if (null === props) return null;
        stateNode = props[registrationName];
        a: switch (registrationName) {
          case "onClick":
          case "onClickCapture":
          case "onDoubleClick":
          case "onDoubleClickCapture":
          case "onMouseDown":
          case "onMouseDownCapture":
          case "onMouseMove":
          case "onMouseMoveCapture":
          case "onMouseUp":
          case "onMouseUpCapture":
          case "onMouseEnter":
            (props = !props.disabled) || (inst = inst.type, props = !("button" === inst || "input" === inst || "select" === inst || "textarea" === inst));
            inst = !props;
            break a;
          default:
            inst = false;
        }
        if (inst) return null;
        if (stateNode && "function" !== typeof stateNode)
          throw Error(
            formatProdErrorMessage(231, registrationName, typeof stateNode)
          );
        return stateNode;
      }
      var canUseDOM = !("undefined" === typeof window || "undefined" === typeof window.document || "undefined" === typeof window.document.createElement);
      var passiveBrowserEventsSupported = false;
      if (canUseDOM)
        try {
          options = {};
          Object.defineProperty(options, "passive", {
            get: function() {
              passiveBrowserEventsSupported = true;
            }
          });
          window.addEventListener("test", options, options);
          window.removeEventListener("test", options, options);
        } catch (e) {
          passiveBrowserEventsSupported = false;
        }
      var options;
      var root = null;
      var startText = null;
      var fallbackText = null;
      function getData() {
        if (fallbackText) return fallbackText;
        var start, startValue = startText, startLength = startValue.length, end, endValue = "value" in root ? root.value : root.textContent, endLength = endValue.length;
        for (start = 0; start < startLength && startValue[start] === endValue[start]; start++) ;
        var minEnd = startLength - start;
        for (end = 1; end <= minEnd && startValue[startLength - end] === endValue[endLength - end]; end++) ;
        return fallbackText = endValue.slice(start, 1 < end ? 1 - end : void 0);
      }
      function getEventCharCode(nativeEvent) {
        var keyCode = nativeEvent.keyCode;
        "charCode" in nativeEvent ? (nativeEvent = nativeEvent.charCode, 0 === nativeEvent && 13 === keyCode && (nativeEvent = 13)) : nativeEvent = keyCode;
        10 === nativeEvent && (nativeEvent = 13);
        return 32 <= nativeEvent || 13 === nativeEvent ? nativeEvent : 0;
      }
      function functionThatReturnsTrue() {
        return true;
      }
      function functionThatReturnsFalse() {
        return false;
      }
      function createSyntheticEvent(Interface) {
        function SyntheticBaseEvent(reactName, reactEventType, targetInst, nativeEvent, nativeEventTarget) {
          this._reactName = reactName;
          this._targetInst = targetInst;
          this.type = reactEventType;
          this.nativeEvent = nativeEvent;
          this.target = nativeEventTarget;
          this.currentTarget = null;
          for (var propName in Interface)
            Interface.hasOwnProperty(propName) && (reactName = Interface[propName], this[propName] = reactName ? reactName(nativeEvent) : nativeEvent[propName]);
          this.isDefaultPrevented = (null != nativeEvent.defaultPrevented ? nativeEvent.defaultPrevented : false === nativeEvent.returnValue) ? functionThatReturnsTrue : functionThatReturnsFalse;
          this.isPropagationStopped = functionThatReturnsFalse;
          return this;
        }
        assign(SyntheticBaseEvent.prototype, {
          preventDefault: function() {
            this.defaultPrevented = true;
            var event = this.nativeEvent;
            event && (event.preventDefault ? event.preventDefault() : "unknown" !== typeof event.returnValue && (event.returnValue = false), this.isDefaultPrevented = functionThatReturnsTrue);
          },
          stopPropagation: function() {
            var event = this.nativeEvent;
            event && (event.stopPropagation ? event.stopPropagation() : "unknown" !== typeof event.cancelBubble && (event.cancelBubble = true), this.isPropagationStopped = functionThatReturnsTrue);
          },
          persist: function() {
          },
          isPersistent: functionThatReturnsTrue
        });
        return SyntheticBaseEvent;
      }
      var EventInterface = {
        eventPhase: 0,
        bubbles: 0,
        cancelable: 0,
        timeStamp: function(event) {
          return event.timeStamp || Date.now();
        },
        defaultPrevented: 0,
        isTrusted: 0
      };
      var SyntheticEvent = createSyntheticEvent(EventInterface);
      var UIEventInterface = assign({}, EventInterface, { view: 0, detail: 0 });
      var SyntheticUIEvent = createSyntheticEvent(UIEventInterface);
      var lastMovementX;
      var lastMovementY;
      var lastMouseEvent;
      var MouseEventInterface = assign({}, UIEventInterface, {
        screenX: 0,
        screenY: 0,
        clientX: 0,
        clientY: 0,
        pageX: 0,
        pageY: 0,
        ctrlKey: 0,
        shiftKey: 0,
        altKey: 0,
        metaKey: 0,
        getModifierState: getEventModifierState,
        button: 0,
        buttons: 0,
        relatedTarget: function(event) {
          return void 0 === event.relatedTarget ? event.fromElement === event.srcElement ? event.toElement : event.fromElement : event.relatedTarget;
        },
        movementX: function(event) {
          if ("movementX" in event) return event.movementX;
          event !== lastMouseEvent && (lastMouseEvent && "mousemove" === event.type ? (lastMovementX = event.screenX - lastMouseEvent.screenX, lastMovementY = event.screenY - lastMouseEvent.screenY) : lastMovementY = lastMovementX = 0, lastMouseEvent = event);
          return lastMovementX;
        },
        movementY: function(event) {
          return "movementY" in event ? event.movementY : lastMovementY;
        }
      });
      var SyntheticMouseEvent = createSyntheticEvent(MouseEventInterface);
      var DragEventInterface = assign({}, MouseEventInterface, { dataTransfer: 0 });
      var SyntheticDragEvent = createSyntheticEvent(DragEventInterface);
      var FocusEventInterface = assign({}, UIEventInterface, { relatedTarget: 0 });
      var SyntheticFocusEvent = createSyntheticEvent(FocusEventInterface);
      var AnimationEventInterface = assign({}, EventInterface, {
        animationName: 0,
        elapsedTime: 0,
        pseudoElement: 0
      });
      var SyntheticAnimationEvent = createSyntheticEvent(AnimationEventInterface);
      var ClipboardEventInterface = assign({}, EventInterface, {
        clipboardData: function(event) {
          return "clipboardData" in event ? event.clipboardData : window.clipboardData;
        }
      });
      var SyntheticClipboardEvent = createSyntheticEvent(ClipboardEventInterface);
      var CompositionEventInterface = assign({}, EventInterface, { data: 0 });
      var SyntheticCompositionEvent = createSyntheticEvent(CompositionEventInterface);
      var normalizeKey = {
        Esc: "Escape",
        Spacebar: " ",
        Left: "ArrowLeft",
        Up: "ArrowUp",
        Right: "ArrowRight",
        Down: "ArrowDown",
        Del: "Delete",
        Win: "OS",
        Menu: "ContextMenu",
        Apps: "ContextMenu",
        Scroll: "ScrollLock",
        MozPrintableKey: "Unidentified"
      };
      var translateToKey = {
        8: "Backspace",
        9: "Tab",
        12: "Clear",
        13: "Enter",
        16: "Shift",
        17: "Control",
        18: "Alt",
        19: "Pause",
        20: "CapsLock",
        27: "Escape",
        32: " ",
        33: "PageUp",
        34: "PageDown",
        35: "End",
        36: "Home",
        37: "ArrowLeft",
        38: "ArrowUp",
        39: "ArrowRight",
        40: "ArrowDown",
        45: "Insert",
        46: "Delete",
        112: "F1",
        113: "F2",
        114: "F3",
        115: "F4",
        116: "F5",
        117: "F6",
        118: "F7",
        119: "F8",
        120: "F9",
        121: "F10",
        122: "F11",
        123: "F12",
        144: "NumLock",
        145: "ScrollLock",
        224: "Meta"
      };
      var modifierKeyToProp = {
        Alt: "altKey",
        Control: "ctrlKey",
        Meta: "metaKey",
        Shift: "shiftKey"
      };
      function modifierStateGetter(keyArg) {
        var nativeEvent = this.nativeEvent;
        return nativeEvent.getModifierState ? nativeEvent.getModifierState(keyArg) : (keyArg = modifierKeyToProp[keyArg]) ? !!nativeEvent[keyArg] : false;
      }
      function getEventModifierState() {
        return modifierStateGetter;
      }
      var KeyboardEventInterface = assign({}, UIEventInterface, {
        key: function(nativeEvent) {
          if (nativeEvent.key) {
            var key = normalizeKey[nativeEvent.key] || nativeEvent.key;
            if ("Unidentified" !== key) return key;
          }
          return "keypress" === nativeEvent.type ? (nativeEvent = getEventCharCode(nativeEvent), 13 === nativeEvent ? "Enter" : String.fromCharCode(nativeEvent)) : "keydown" === nativeEvent.type || "keyup" === nativeEvent.type ? translateToKey[nativeEvent.keyCode] || "Unidentified" : "";
        },
        code: 0,
        location: 0,
        ctrlKey: 0,
        shiftKey: 0,
        altKey: 0,
        metaKey: 0,
        repeat: 0,
        locale: 0,
        getModifierState: getEventModifierState,
        charCode: function(event) {
          return "keypress" === event.type ? getEventCharCode(event) : 0;
        },
        keyCode: function(event) {
          return "keydown" === event.type || "keyup" === event.type ? event.keyCode : 0;
        },
        which: function(event) {
          return "keypress" === event.type ? getEventCharCode(event) : "keydown" === event.type || "keyup" === event.type ? event.keyCode : 0;
        }
      });
      var SyntheticKeyboardEvent = createSyntheticEvent(KeyboardEventInterface);
      var PointerEventInterface = assign({}, MouseEventInterface, {
        pointerId: 0,
        width: 0,
        height: 0,
        pressure: 0,
        tangentialPressure: 0,
        tiltX: 0,
        tiltY: 0,
        twist: 0,
        pointerType: 0,
        isPrimary: 0
      });
      var SyntheticPointerEvent = createSyntheticEvent(PointerEventInterface);
      var TouchEventInterface = assign({}, UIEventInterface, {
        touches: 0,
        targetTouches: 0,
        changedTouches: 0,
        altKey: 0,
        metaKey: 0,
        ctrlKey: 0,
        shiftKey: 0,
        getModifierState: getEventModifierState
      });
      var SyntheticTouchEvent = createSyntheticEvent(TouchEventInterface);
      var TransitionEventInterface = assign({}, EventInterface, {
        propertyName: 0,
        elapsedTime: 0,
        pseudoElement: 0
      });
      var SyntheticTransitionEvent = createSyntheticEvent(TransitionEventInterface);
      var WheelEventInterface = assign({}, MouseEventInterface, {
        deltaX: function(event) {
          return "deltaX" in event ? event.deltaX : "wheelDeltaX" in event ? -event.wheelDeltaX : 0;
        },
        deltaY: function(event) {
          return "deltaY" in event ? event.deltaY : "wheelDeltaY" in event ? -event.wheelDeltaY : "wheelDelta" in event ? -event.wheelDelta : 0;
        },
        deltaZ: 0,
        deltaMode: 0
      });
      var SyntheticWheelEvent = createSyntheticEvent(WheelEventInterface);
      var ToggleEventInterface = assign({}, EventInterface, {
        newState: 0,
        oldState: 0
      });
      var SyntheticToggleEvent = createSyntheticEvent(ToggleEventInterface);
      var END_KEYCODES = [9, 13, 27, 32];
      var canUseCompositionEvent = canUseDOM && "CompositionEvent" in window;
      var documentMode = null;
      canUseDOM && "documentMode" in document && (documentMode = document.documentMode);
      var canUseTextInputEvent = canUseDOM && "TextEvent" in window && !documentMode;
      var useFallbackCompositionData = canUseDOM && (!canUseCompositionEvent || documentMode && 8 < documentMode && 11 >= documentMode);
      var SPACEBAR_CHAR = String.fromCharCode(32);
      var hasSpaceKeypress = false;
      function isFallbackCompositionEnd(domEventName, nativeEvent) {
        switch (domEventName) {
          case "keyup":
            return -1 !== END_KEYCODES.indexOf(nativeEvent.keyCode);
          case "keydown":
            return 229 !== nativeEvent.keyCode;
          case "keypress":
          case "mousedown":
          case "focusout":
            return true;
          default:
            return false;
        }
      }
      function getDataFromCustomEvent(nativeEvent) {
        nativeEvent = nativeEvent.detail;
        return "object" === typeof nativeEvent && "data" in nativeEvent ? nativeEvent.data : null;
      }
      var isComposing = false;
      function getNativeBeforeInputChars(domEventName, nativeEvent) {
        switch (domEventName) {
          case "compositionend":
            return getDataFromCustomEvent(nativeEvent);
          case "keypress":
            if (32 !== nativeEvent.which) return null;
            hasSpaceKeypress = true;
            return SPACEBAR_CHAR;
          case "textInput":
            return domEventName = nativeEvent.data, domEventName === SPACEBAR_CHAR && hasSpaceKeypress ? null : domEventName;
          default:
            return null;
        }
      }
      function getFallbackBeforeInputChars(domEventName, nativeEvent) {
        if (isComposing)
          return "compositionend" === domEventName || !canUseCompositionEvent && isFallbackCompositionEnd(domEventName, nativeEvent) ? (domEventName = getData(), fallbackText = startText = root = null, isComposing = false, domEventName) : null;
        switch (domEventName) {
          case "paste":
            return null;
          case "keypress":
            if (!(nativeEvent.ctrlKey || nativeEvent.altKey || nativeEvent.metaKey) || nativeEvent.ctrlKey && nativeEvent.altKey) {
              if (nativeEvent.char && 1 < nativeEvent.char.length)
                return nativeEvent.char;
              if (nativeEvent.which) return String.fromCharCode(nativeEvent.which);
            }
            return null;
          case "compositionend":
            return useFallbackCompositionData && "ko" !== nativeEvent.locale ? null : nativeEvent.data;
          default:
            return null;
        }
      }
      var supportedInputTypes = {
        color: true,
        date: true,
        datetime: true,
        "datetime-local": true,
        email: true,
        month: true,
        number: true,
        password: true,
        range: true,
        search: true,
        tel: true,
        text: true,
        time: true,
        url: true,
        week: true
      };
      function isTextInputElement(elem) {
        var nodeName = elem && elem.nodeName && elem.nodeName.toLowerCase();
        return "input" === nodeName ? !!supportedInputTypes[elem.type] : "textarea" === nodeName ? true : false;
      }
      function createAndAccumulateChangeEvent(dispatchQueue, inst, nativeEvent, target) {
        restoreTarget ? restoreQueue ? restoreQueue.push(target) : restoreQueue = [target] : restoreTarget = target;
        inst = accumulateTwoPhaseListeners(inst, "onChange");
        0 < inst.length && (nativeEvent = new SyntheticEvent(
          "onChange",
          "change",
          null,
          nativeEvent,
          target
        ), dispatchQueue.push({ event: nativeEvent, listeners: inst }));
      }
      var activeElement$1 = null;
      var activeElementInst$1 = null;
      function runEventInBatch(dispatchQueue) {
        processDispatchQueue(dispatchQueue, 0);
      }
      function getInstIfValueChanged(targetInst) {
        var targetNode = getNodeFromInstance(targetInst);
        if (updateValueIfChanged(targetNode)) return targetInst;
      }
      function getTargetInstForChangeEvent(domEventName, targetInst) {
        if ("change" === domEventName) return targetInst;
      }
      var isInputEventSupported = false;
      if (canUseDOM) {
        if (canUseDOM) {
          isSupported$jscomp$inline_427 = "oninput" in document;
          if (!isSupported$jscomp$inline_427) {
            element$jscomp$inline_428 = document.createElement("div");
            element$jscomp$inline_428.setAttribute("oninput", "return;");
            isSupported$jscomp$inline_427 = "function" === typeof element$jscomp$inline_428.oninput;
          }
          JSCompiler_inline_result$jscomp$286 = isSupported$jscomp$inline_427;
        } else JSCompiler_inline_result$jscomp$286 = false;
        isInputEventSupported = JSCompiler_inline_result$jscomp$286 && (!document.documentMode || 9 < document.documentMode);
      }
      var JSCompiler_inline_result$jscomp$286;
      var isSupported$jscomp$inline_427;
      var element$jscomp$inline_428;
      function stopWatchingForValueChange() {
        activeElement$1 && (activeElement$1.detachEvent("onpropertychange", handlePropertyChange), activeElementInst$1 = activeElement$1 = null);
      }
      function handlePropertyChange(nativeEvent) {
        if ("value" === nativeEvent.propertyName && getInstIfValueChanged(activeElementInst$1)) {
          var dispatchQueue = [];
          createAndAccumulateChangeEvent(
            dispatchQueue,
            activeElementInst$1,
            nativeEvent,
            getEventTarget(nativeEvent)
          );
          batchedUpdates$1(runEventInBatch, dispatchQueue);
        }
      }
      function handleEventsForInputEventPolyfill(domEventName, target, targetInst) {
        "focusin" === domEventName ? (stopWatchingForValueChange(), activeElement$1 = target, activeElementInst$1 = targetInst, activeElement$1.attachEvent("onpropertychange", handlePropertyChange)) : "focusout" === domEventName && stopWatchingForValueChange();
      }
      function getTargetInstForInputEventPolyfill(domEventName) {
        if ("selectionchange" === domEventName || "keyup" === domEventName || "keydown" === domEventName)
          return getInstIfValueChanged(activeElementInst$1);
      }
      function getTargetInstForClickEvent(domEventName, targetInst) {
        if ("click" === domEventName) return getInstIfValueChanged(targetInst);
      }
      function getTargetInstForInputOrChangeEvent(domEventName, targetInst) {
        if ("input" === domEventName || "change" === domEventName)
          return getInstIfValueChanged(targetInst);
      }
      function is(x, y) {
        return x === y && (0 !== x || 1 / x === 1 / y) || x !== x && y !== y;
      }
      var objectIs = "function" === typeof Object.is ? Object.is : is;
      function shallowEqual(objA, objB) {
        if (objectIs(objA, objB)) return true;
        if ("object" !== typeof objA || null === objA || "object" !== typeof objB || null === objB)
          return false;
        var keysA = Object.keys(objA), keysB = Object.keys(objB);
        if (keysA.length !== keysB.length) return false;
        for (keysB = 0; keysB < keysA.length; keysB++) {
          var currentKey = keysA[keysB];
          if (!hasOwnProperty.call(objB, currentKey) || !objectIs(objA[currentKey], objB[currentKey]))
            return false;
        }
        return true;
      }
      function getLeafNode(node) {
        for (; node && node.firstChild; ) node = node.firstChild;
        return node;
      }
      function getNodeForCharacterOffset(root2, offset) {
        var node = getLeafNode(root2);
        root2 = 0;
        for (var nodeEnd; node; ) {
          if (3 === node.nodeType) {
            nodeEnd = root2 + node.textContent.length;
            if (root2 <= offset && nodeEnd >= offset)
              return { node, offset: offset - root2 };
            root2 = nodeEnd;
          }
          a: {
            for (; node; ) {
              if (node.nextSibling) {
                node = node.nextSibling;
                break a;
              }
              node = node.parentNode;
            }
            node = void 0;
          }
          node = getLeafNode(node);
        }
      }
      function containsNode(outerNode, innerNode) {
        return outerNode && innerNode ? outerNode === innerNode ? true : outerNode && 3 === outerNode.nodeType ? false : innerNode && 3 === innerNode.nodeType ? containsNode(outerNode, innerNode.parentNode) : "contains" in outerNode ? outerNode.contains(innerNode) : outerNode.compareDocumentPosition ? !!(outerNode.compareDocumentPosition(innerNode) & 16) : false : false;
      }
      function getActiveElementDeep(containerInfo) {
        containerInfo = null != containerInfo && null != containerInfo.ownerDocument && null != containerInfo.ownerDocument.defaultView ? containerInfo.ownerDocument.defaultView : window;
        for (var element = getActiveElement(containerInfo.document); element instanceof containerInfo.HTMLIFrameElement; ) {
          try {
            var JSCompiler_inline_result = "string" === typeof element.contentWindow.location.href;
          } catch (err) {
            JSCompiler_inline_result = false;
          }
          if (JSCompiler_inline_result) containerInfo = element.contentWindow;
          else break;
          element = getActiveElement(containerInfo.document);
        }
        return element;
      }
      function hasSelectionCapabilities(elem) {
        var nodeName = elem && elem.nodeName && elem.nodeName.toLowerCase();
        return nodeName && ("input" === nodeName && ("text" === elem.type || "search" === elem.type || "tel" === elem.type || "url" === elem.type || "password" === elem.type) || "textarea" === nodeName || "true" === elem.contentEditable);
      }
      var skipSelectionChangeEvent = canUseDOM && "documentMode" in document && 11 >= document.documentMode;
      var activeElement = null;
      var activeElementInst = null;
      var lastSelection = null;
      var mouseDown = false;
      function constructSelectEvent(dispatchQueue, nativeEvent, nativeEventTarget) {
        var doc = nativeEventTarget.window === nativeEventTarget ? nativeEventTarget.document : 9 === nativeEventTarget.nodeType ? nativeEventTarget : nativeEventTarget.ownerDocument;
        mouseDown || null == activeElement || activeElement !== getActiveElement(doc) || (doc = activeElement, "selectionStart" in doc && hasSelectionCapabilities(doc) ? doc = { start: doc.selectionStart, end: doc.selectionEnd } : (doc = (doc.ownerDocument && doc.ownerDocument.defaultView || window).getSelection(), doc = {
          anchorNode: doc.anchorNode,
          anchorOffset: doc.anchorOffset,
          focusNode: doc.focusNode,
          focusOffset: doc.focusOffset
        }), lastSelection && shallowEqual(lastSelection, doc) || (lastSelection = doc, doc = accumulateTwoPhaseListeners(activeElementInst, "onSelect"), 0 < doc.length && (nativeEvent = new SyntheticEvent(
          "onSelect",
          "select",
          null,
          nativeEvent,
          nativeEventTarget
        ), dispatchQueue.push({ event: nativeEvent, listeners: doc }), nativeEvent.target = activeElement)));
      }
      function makePrefixMap(styleProp, eventName) {
        var prefixes = {};
        prefixes[styleProp.toLowerCase()] = eventName.toLowerCase();
        prefixes["Webkit" + styleProp] = "webkit" + eventName;
        prefixes["Moz" + styleProp] = "moz" + eventName;
        return prefixes;
      }
      var vendorPrefixes = {
        animationend: makePrefixMap("Animation", "AnimationEnd"),
        animationiteration: makePrefixMap("Animation", "AnimationIteration"),
        animationstart: makePrefixMap("Animation", "AnimationStart"),
        transitionrun: makePrefixMap("Transition", "TransitionRun"),
        transitionstart: makePrefixMap("Transition", "TransitionStart"),
        transitioncancel: makePrefixMap("Transition", "TransitionCancel"),
        transitionend: makePrefixMap("Transition", "TransitionEnd")
      };
      var prefixedEventNames = {};
      var style = {};
      canUseDOM && (style = document.createElement("div").style, "AnimationEvent" in window || (delete vendorPrefixes.animationend.animation, delete vendorPrefixes.animationiteration.animation, delete vendorPrefixes.animationstart.animation), "TransitionEvent" in window || delete vendorPrefixes.transitionend.transition);
      function getVendorPrefixedEventName(eventName) {
        if (prefixedEventNames[eventName]) return prefixedEventNames[eventName];
        if (!vendorPrefixes[eventName]) return eventName;
        var prefixMap = vendorPrefixes[eventName], styleProp;
        for (styleProp in prefixMap)
          if (prefixMap.hasOwnProperty(styleProp) && styleProp in style)
            return prefixedEventNames[eventName] = prefixMap[styleProp];
        return eventName;
      }
      var ANIMATION_END = getVendorPrefixedEventName("animationend");
      var ANIMATION_ITERATION = getVendorPrefixedEventName("animationiteration");
      var ANIMATION_START = getVendorPrefixedEventName("animationstart");
      var TRANSITION_RUN = getVendorPrefixedEventName("transitionrun");
      var TRANSITION_START = getVendorPrefixedEventName("transitionstart");
      var TRANSITION_CANCEL = getVendorPrefixedEventName("transitioncancel");
      var TRANSITION_END = getVendorPrefixedEventName("transitionend");
      var topLevelEventsToReactNames = /* @__PURE__ */ new Map();
      var simpleEventPluginEvents = "abort auxClick beforeToggle cancel canPlay canPlayThrough click close contextMenu copy cut drag dragEnd dragEnter dragExit dragLeave dragOver dragStart drop durationChange emptied encrypted ended error gotPointerCapture input invalid keyDown keyPress keyUp load loadedData loadedMetadata loadStart lostPointerCapture mouseDown mouseMove mouseOut mouseOver mouseUp paste pause play playing pointerCancel pointerDown pointerMove pointerOut pointerOver pointerUp progress rateChange reset resize seeked seeking stalled submit suspend timeUpdate touchCancel touchEnd touchStart volumeChange scroll toggle touchMove waiting wheel".split(
        " "
      );
      simpleEventPluginEvents.push("scrollEnd");
      function registerSimpleEvent(domEventName, reactName) {
        topLevelEventsToReactNames.set(domEventName, reactName);
        registerTwoPhaseEvent(reactName, [domEventName]);
      }
      var reportGlobalError = "function" === typeof reportError ? reportError : function(error) {
        if ("object" === typeof window && "function" === typeof window.ErrorEvent) {
          var event = new window.ErrorEvent("error", {
            bubbles: true,
            cancelable: true,
            message: "object" === typeof error && null !== error && "string" === typeof error.message ? String(error.message) : String(error),
            error
          });
          if (!window.dispatchEvent(event)) return;
        } else if ("object" === typeof process && "function" === typeof process.emit) {
          process.emit("uncaughtException", error);
          return;
        }
        console.error(error);
      };
      var concurrentQueues = [];
      var concurrentQueuesIndex = 0;
      var concurrentlyUpdatedLanes = 0;
      function finishQueueingConcurrentUpdates() {
        for (var endIndex = concurrentQueuesIndex, i = concurrentlyUpdatedLanes = concurrentQueuesIndex = 0; i < endIndex; ) {
          var fiber = concurrentQueues[i];
          concurrentQueues[i++] = null;
          var queue = concurrentQueues[i];
          concurrentQueues[i++] = null;
          var update = concurrentQueues[i];
          concurrentQueues[i++] = null;
          var lane = concurrentQueues[i];
          concurrentQueues[i++] = null;
          if (null !== queue && null !== update) {
            var pending = queue.pending;
            null === pending ? update.next = update : (update.next = pending.next, pending.next = update);
            queue.pending = update;
          }
          0 !== lane && markUpdateLaneFromFiberToRoot(fiber, update, lane);
        }
      }
      function enqueueUpdate$1(fiber, queue, update, lane) {
        concurrentQueues[concurrentQueuesIndex++] = fiber;
        concurrentQueues[concurrentQueuesIndex++] = queue;
        concurrentQueues[concurrentQueuesIndex++] = update;
        concurrentQueues[concurrentQueuesIndex++] = lane;
        concurrentlyUpdatedLanes |= lane;
        fiber.lanes |= lane;
        fiber = fiber.alternate;
        null !== fiber && (fiber.lanes |= lane);
      }
      function enqueueConcurrentHookUpdate(fiber, queue, update, lane) {
        enqueueUpdate$1(fiber, queue, update, lane);
        return getRootForUpdatedFiber(fiber);
      }
      function enqueueConcurrentRenderForLane(fiber, lane) {
        enqueueUpdate$1(fiber, null, null, lane);
        return getRootForUpdatedFiber(fiber);
      }
      function markUpdateLaneFromFiberToRoot(sourceFiber, update, lane) {
        sourceFiber.lanes |= lane;
        var alternate = sourceFiber.alternate;
        null !== alternate && (alternate.lanes |= lane);
        for (var isHidden = false, parent = sourceFiber.return; null !== parent; )
          parent.childLanes |= lane, alternate = parent.alternate, null !== alternate && (alternate.childLanes |= lane), 22 === parent.tag && (sourceFiber = parent.stateNode, null === sourceFiber || sourceFiber._visibility & 1 || (isHidden = true)), sourceFiber = parent, parent = parent.return;
        return 3 === sourceFiber.tag ? (parent = sourceFiber.stateNode, isHidden && null !== update && (isHidden = 31 - clz32(lane), sourceFiber = parent.hiddenUpdates, alternate = sourceFiber[isHidden], null === alternate ? sourceFiber[isHidden] = [update] : alternate.push(update), update.lane = lane | 536870912), parent) : null;
      }
      function getRootForUpdatedFiber(sourceFiber) {
        if (50 < nestedUpdateCount)
          throw nestedUpdateCount = 0, rootWithNestedUpdates = null, Error(formatProdErrorMessage(185));
        for (var parent = sourceFiber.return; null !== parent; )
          sourceFiber = parent, parent = sourceFiber.return;
        return 3 === sourceFiber.tag ? sourceFiber.stateNode : null;
      }
      var emptyContextObject = {};
      function FiberNode(tag, pendingProps, key, mode) {
        this.tag = tag;
        this.key = key;
        this.sibling = this.child = this.return = this.stateNode = this.type = this.elementType = null;
        this.index = 0;
        this.refCleanup = this.ref = null;
        this.pendingProps = pendingProps;
        this.dependencies = this.memoizedState = this.updateQueue = this.memoizedProps = null;
        this.mode = mode;
        this.subtreeFlags = this.flags = 0;
        this.deletions = null;
        this.childLanes = this.lanes = 0;
        this.alternate = null;
      }
      function createFiberImplClass(tag, pendingProps, key, mode) {
        return new FiberNode(tag, pendingProps, key, mode);
      }
      function shouldConstruct(Component) {
        Component = Component.prototype;
        return !(!Component || !Component.isReactComponent);
      }
      function createWorkInProgress(current, pendingProps) {
        var workInProgress2 = current.alternate;
        null === workInProgress2 ? (workInProgress2 = createFiberImplClass(
          current.tag,
          pendingProps,
          current.key,
          current.mode
        ), workInProgress2.elementType = current.elementType, workInProgress2.type = current.type, workInProgress2.stateNode = current.stateNode, workInProgress2.alternate = current, current.alternate = workInProgress2) : (workInProgress2.pendingProps = pendingProps, workInProgress2.type = current.type, workInProgress2.flags = 0, workInProgress2.subtreeFlags = 0, workInProgress2.deletions = null);
        workInProgress2.flags = current.flags & 65011712;
        workInProgress2.childLanes = current.childLanes;
        workInProgress2.lanes = current.lanes;
        workInProgress2.child = current.child;
        workInProgress2.memoizedProps = current.memoizedProps;
        workInProgress2.memoizedState = current.memoizedState;
        workInProgress2.updateQueue = current.updateQueue;
        pendingProps = current.dependencies;
        workInProgress2.dependencies = null === pendingProps ? null : { lanes: pendingProps.lanes, firstContext: pendingProps.firstContext };
        workInProgress2.sibling = current.sibling;
        workInProgress2.index = current.index;
        workInProgress2.ref = current.ref;
        workInProgress2.refCleanup = current.refCleanup;
        return workInProgress2;
      }
      function resetWorkInProgress(workInProgress2, renderLanes2) {
        workInProgress2.flags &= 65011714;
        var current = workInProgress2.alternate;
        null === current ? (workInProgress2.childLanes = 0, workInProgress2.lanes = renderLanes2, workInProgress2.child = null, workInProgress2.subtreeFlags = 0, workInProgress2.memoizedProps = null, workInProgress2.memoizedState = null, workInProgress2.updateQueue = null, workInProgress2.dependencies = null, workInProgress2.stateNode = null) : (workInProgress2.childLanes = current.childLanes, workInProgress2.lanes = current.lanes, workInProgress2.child = current.child, workInProgress2.subtreeFlags = 0, workInProgress2.deletions = null, workInProgress2.memoizedProps = current.memoizedProps, workInProgress2.memoizedState = current.memoizedState, workInProgress2.updateQueue = current.updateQueue, workInProgress2.type = current.type, renderLanes2 = current.dependencies, workInProgress2.dependencies = null === renderLanes2 ? null : {
          lanes: renderLanes2.lanes,
          firstContext: renderLanes2.firstContext
        });
        return workInProgress2;
      }
      function createFiberFromTypeAndProps(type, key, pendingProps, owner, mode, lanes) {
        var fiberTag = 0;
        owner = type;
        if ("function" === typeof type) shouldConstruct(type) && (fiberTag = 1);
        else if ("string" === typeof type)
          fiberTag = isHostHoistableType(
            type,
            pendingProps,
            contextStackCursor.current
          ) ? 26 : "html" === type || "head" === type || "body" === type ? 27 : 5;
        else
          a: switch (type) {
            case REACT_ACTIVITY_TYPE:
              return type = createFiberImplClass(31, pendingProps, key, mode), type.elementType = REACT_ACTIVITY_TYPE, type.lanes = lanes, type;
            case REACT_FRAGMENT_TYPE:
              return createFiberFromFragment(pendingProps.children, mode, lanes, key);
            case REACT_STRICT_MODE_TYPE:
              fiberTag = 8;
              mode |= 24;
              break;
            case REACT_PROFILER_TYPE:
              return type = createFiberImplClass(12, pendingProps, key, mode | 2), type.elementType = REACT_PROFILER_TYPE, type.lanes = lanes, type;
            case REACT_SUSPENSE_TYPE:
              return type = createFiberImplClass(13, pendingProps, key, mode), type.elementType = REACT_SUSPENSE_TYPE, type.lanes = lanes, type;
            case REACT_SUSPENSE_LIST_TYPE:
              return type = createFiberImplClass(19, pendingProps, key, mode), type.elementType = REACT_SUSPENSE_LIST_TYPE, type.lanes = lanes, type;
            default:
              if ("object" === typeof type && null !== type)
                switch (type.$$typeof) {
                  case REACT_CONTEXT_TYPE:
                    fiberTag = 10;
                    break a;
                  case REACT_CONSUMER_TYPE:
                    fiberTag = 9;
                    break a;
                  case REACT_FORWARD_REF_TYPE:
                    fiberTag = 11;
                    break a;
                  case REACT_MEMO_TYPE:
                    fiberTag = 14;
                    break a;
                  case REACT_LAZY_TYPE:
                    fiberTag = 16;
                    owner = null;
                    break a;
                }
              fiberTag = 29;
              pendingProps = Error(
                formatProdErrorMessage(130, null === type ? "null" : typeof type, "")
              );
              owner = null;
          }
        key = createFiberImplClass(fiberTag, pendingProps, key, mode);
        key.elementType = type;
        key.type = owner;
        key.lanes = lanes;
        return key;
      }
      function createFiberFromFragment(elements, mode, lanes, key) {
        elements = createFiberImplClass(7, elements, key, mode);
        elements.lanes = lanes;
        return elements;
      }
      function createFiberFromText(content, mode, lanes) {
        content = createFiberImplClass(6, content, null, mode);
        content.lanes = lanes;
        return content;
      }
      function createFiberFromDehydratedFragment(dehydratedNode) {
        var fiber = createFiberImplClass(18, null, null, 0);
        fiber.stateNode = dehydratedNode;
        return fiber;
      }
      function createFiberFromPortal(portal, mode, lanes) {
        mode = createFiberImplClass(
          4,
          null !== portal.children ? portal.children : [],
          portal.key,
          mode
        );
        mode.lanes = lanes;
        mode.stateNode = {
          containerInfo: portal.containerInfo,
          pendingChildren: null,
          implementation: portal.implementation
        };
        return mode;
      }
      var CapturedStacks = /* @__PURE__ */ new WeakMap();
      function createCapturedValueAtFiber(value, source) {
        if ("object" === typeof value && null !== value) {
          var existing = CapturedStacks.get(value);
          if (void 0 !== existing) return existing;
          source = {
            value,
            source,
            stack: getStackByFiberInDevAndProd(source)
          };
          CapturedStacks.set(value, source);
          return source;
        }
        return {
          value,
          source,
          stack: getStackByFiberInDevAndProd(source)
        };
      }
      var forkStack = [];
      var forkStackIndex = 0;
      var treeForkProvider = null;
      var treeForkCount = 0;
      var idStack = [];
      var idStackIndex = 0;
      var treeContextProvider = null;
      var treeContextId = 1;
      var treeContextOverflow = "";
      function pushTreeFork(workInProgress2, totalChildren) {
        forkStack[forkStackIndex++] = treeForkCount;
        forkStack[forkStackIndex++] = treeForkProvider;
        treeForkProvider = workInProgress2;
        treeForkCount = totalChildren;
      }
      function pushTreeId(workInProgress2, totalChildren, index2) {
        idStack[idStackIndex++] = treeContextId;
        idStack[idStackIndex++] = treeContextOverflow;
        idStack[idStackIndex++] = treeContextProvider;
        treeContextProvider = workInProgress2;
        var baseIdWithLeadingBit = treeContextId;
        workInProgress2 = treeContextOverflow;
        var baseLength = 32 - clz32(baseIdWithLeadingBit) - 1;
        baseIdWithLeadingBit &= ~(1 << baseLength);
        index2 += 1;
        var length = 32 - clz32(totalChildren) + baseLength;
        if (30 < length) {
          var numberOfOverflowBits = baseLength - baseLength % 5;
          length = (baseIdWithLeadingBit & (1 << numberOfOverflowBits) - 1).toString(32);
          baseIdWithLeadingBit >>= numberOfOverflowBits;
          baseLength -= numberOfOverflowBits;
          treeContextId = 1 << 32 - clz32(totalChildren) + baseLength | index2 << baseLength | baseIdWithLeadingBit;
          treeContextOverflow = length + workInProgress2;
        } else
          treeContextId = 1 << length | index2 << baseLength | baseIdWithLeadingBit, treeContextOverflow = workInProgress2;
      }
      function pushMaterializedTreeId(workInProgress2) {
        null !== workInProgress2.return && (pushTreeFork(workInProgress2, 1), pushTreeId(workInProgress2, 1, 0));
      }
      function popTreeContext(workInProgress2) {
        for (; workInProgress2 === treeForkProvider; )
          treeForkProvider = forkStack[--forkStackIndex], forkStack[forkStackIndex] = null, treeForkCount = forkStack[--forkStackIndex], forkStack[forkStackIndex] = null;
        for (; workInProgress2 === treeContextProvider; )
          treeContextProvider = idStack[--idStackIndex], idStack[idStackIndex] = null, treeContextOverflow = idStack[--idStackIndex], idStack[idStackIndex] = null, treeContextId = idStack[--idStackIndex], idStack[idStackIndex] = null;
      }
      function restoreSuspendedTreeContext(workInProgress2, suspendedContext) {
        idStack[idStackIndex++] = treeContextId;
        idStack[idStackIndex++] = treeContextOverflow;
        idStack[idStackIndex++] = treeContextProvider;
        treeContextId = suspendedContext.id;
        treeContextOverflow = suspendedContext.overflow;
        treeContextProvider = workInProgress2;
      }
      var hydrationParentFiber = null;
      var nextHydratableInstance = null;
      var isHydrating = false;
      var hydrationErrors = null;
      var rootOrSingletonContext = false;
      var HydrationMismatchException = Error(formatProdErrorMessage(519));
      function throwOnHydrationMismatch(fiber) {
        var error = Error(
          formatProdErrorMessage(
            418,
            1 < arguments.length && void 0 !== arguments[1] && arguments[1] ? "text" : "HTML",
            ""
          )
        );
        queueHydrationError(createCapturedValueAtFiber(error, fiber));
        throw HydrationMismatchException;
      }
      function prepareToHydrateHostInstance(fiber) {
        var instance = fiber.stateNode, type = fiber.type, props = fiber.memoizedProps;
        instance[internalInstanceKey] = fiber;
        instance[internalPropsKey] = props;
        switch (type) {
          case "dialog":
            listenToNonDelegatedEvent("cancel", instance);
            listenToNonDelegatedEvent("close", instance);
            break;
          case "iframe":
          case "object":
          case "embed":
            listenToNonDelegatedEvent("load", instance);
            break;
          case "video":
          case "audio":
            for (type = 0; type < mediaEventTypes.length; type++)
              listenToNonDelegatedEvent(mediaEventTypes[type], instance);
            break;
          case "source":
            listenToNonDelegatedEvent("error", instance);
            break;
          case "img":
          case "image":
          case "link":
            listenToNonDelegatedEvent("error", instance);
            listenToNonDelegatedEvent("load", instance);
            break;
          case "details":
            listenToNonDelegatedEvent("toggle", instance);
            break;
          case "input":
            listenToNonDelegatedEvent("invalid", instance);
            initInput(
              instance,
              props.value,
              props.defaultValue,
              props.checked,
              props.defaultChecked,
              props.type,
              props.name,
              true
            );
            break;
          case "select":
            listenToNonDelegatedEvent("invalid", instance);
            break;
          case "textarea":
            listenToNonDelegatedEvent("invalid", instance), initTextarea(instance, props.value, props.defaultValue, props.children);
        }
        type = props.children;
        "string" !== typeof type && "number" !== typeof type && "bigint" !== typeof type || instance.textContent === "" + type || true === props.suppressHydrationWarning || checkForUnmatchedText(instance.textContent, type) ? (null != props.popover && (listenToNonDelegatedEvent("beforetoggle", instance), listenToNonDelegatedEvent("toggle", instance)), null != props.onScroll && listenToNonDelegatedEvent("scroll", instance), null != props.onScrollEnd && listenToNonDelegatedEvent("scrollend", instance), null != props.onClick && (instance.onclick = noop$1), instance = true) : instance = false;
        instance || throwOnHydrationMismatch(fiber, true);
      }
      function popToNextHostParent(fiber) {
        for (hydrationParentFiber = fiber.return; hydrationParentFiber; )
          switch (hydrationParentFiber.tag) {
            case 5:
            case 31:
            case 13:
              rootOrSingletonContext = false;
              return;
            case 27:
            case 3:
              rootOrSingletonContext = true;
              return;
            default:
              hydrationParentFiber = hydrationParentFiber.return;
          }
      }
      function popHydrationState(fiber) {
        if (fiber !== hydrationParentFiber) return false;
        if (!isHydrating) return popToNextHostParent(fiber), isHydrating = true, false;
        var tag = fiber.tag, JSCompiler_temp;
        if (JSCompiler_temp = 3 !== tag && 27 !== tag) {
          if (JSCompiler_temp = 5 === tag)
            JSCompiler_temp = fiber.type, JSCompiler_temp = !("form" !== JSCompiler_temp && "button" !== JSCompiler_temp) || shouldSetTextContent(fiber.type, fiber.memoizedProps);
          JSCompiler_temp = !JSCompiler_temp;
        }
        JSCompiler_temp && nextHydratableInstance && throwOnHydrationMismatch(fiber);
        popToNextHostParent(fiber);
        if (13 === tag) {
          fiber = fiber.memoizedState;
          fiber = null !== fiber ? fiber.dehydrated : null;
          if (!fiber) throw Error(formatProdErrorMessage(317));
          nextHydratableInstance = getNextHydratableInstanceAfterHydrationBoundary(fiber);
        } else if (31 === tag) {
          fiber = fiber.memoizedState;
          fiber = null !== fiber ? fiber.dehydrated : null;
          if (!fiber) throw Error(formatProdErrorMessage(317));
          nextHydratableInstance = getNextHydratableInstanceAfterHydrationBoundary(fiber);
        } else
          27 === tag ? (tag = nextHydratableInstance, isSingletonScope(fiber.type) ? (fiber = previousHydratableOnEnteringScopedSingleton, previousHydratableOnEnteringScopedSingleton = null, nextHydratableInstance = fiber) : nextHydratableInstance = tag) : nextHydratableInstance = hydrationParentFiber ? getNextHydratable(fiber.stateNode.nextSibling) : null;
        return true;
      }
      function resetHydrationState() {
        nextHydratableInstance = hydrationParentFiber = null;
        isHydrating = false;
      }
      function upgradeHydrationErrorsToRecoverable() {
        var queuedErrors = hydrationErrors;
        null !== queuedErrors && (null === workInProgressRootRecoverableErrors ? workInProgressRootRecoverableErrors = queuedErrors : workInProgressRootRecoverableErrors.push.apply(
          workInProgressRootRecoverableErrors,
          queuedErrors
        ), hydrationErrors = null);
        return queuedErrors;
      }
      function queueHydrationError(error) {
        null === hydrationErrors ? hydrationErrors = [error] : hydrationErrors.push(error);
      }
      var valueCursor = createCursor(null);
      var currentlyRenderingFiber$1 = null;
      var lastContextDependency = null;
      function pushProvider(providerFiber, context, nextValue) {
        push(valueCursor, context._currentValue);
        context._currentValue = nextValue;
      }
      function popProvider(context) {
        context._currentValue = valueCursor.current;
        pop(valueCursor);
      }
      function scheduleContextWorkOnParentPath(parent, renderLanes2, propagationRoot) {
        for (; null !== parent; ) {
          var alternate = parent.alternate;
          (parent.childLanes & renderLanes2) !== renderLanes2 ? (parent.childLanes |= renderLanes2, null !== alternate && (alternate.childLanes |= renderLanes2)) : null !== alternate && (alternate.childLanes & renderLanes2) !== renderLanes2 && (alternate.childLanes |= renderLanes2);
          if (parent === propagationRoot) break;
          parent = parent.return;
        }
      }
      function propagateContextChanges(workInProgress2, contexts, renderLanes2, forcePropagateEntireTree) {
        var fiber = workInProgress2.child;
        null !== fiber && (fiber.return = workInProgress2);
        for (; null !== fiber; ) {
          var list = fiber.dependencies;
          if (null !== list) {
            var nextFiber = fiber.child;
            list = list.firstContext;
            a: for (; null !== list; ) {
              var dependency = list;
              list = fiber;
              for (var i = 0; i < contexts.length; i++)
                if (dependency.context === contexts[i]) {
                  list.lanes |= renderLanes2;
                  dependency = list.alternate;
                  null !== dependency && (dependency.lanes |= renderLanes2);
                  scheduleContextWorkOnParentPath(
                    list.return,
                    renderLanes2,
                    workInProgress2
                  );
                  forcePropagateEntireTree || (nextFiber = null);
                  break a;
                }
              list = dependency.next;
            }
          } else if (18 === fiber.tag) {
            nextFiber = fiber.return;
            if (null === nextFiber) throw Error(formatProdErrorMessage(341));
            nextFiber.lanes |= renderLanes2;
            list = nextFiber.alternate;
            null !== list && (list.lanes |= renderLanes2);
            scheduleContextWorkOnParentPath(nextFiber, renderLanes2, workInProgress2);
            nextFiber = null;
          } else nextFiber = fiber.child;
          if (null !== nextFiber) nextFiber.return = fiber;
          else
            for (nextFiber = fiber; null !== nextFiber; ) {
              if (nextFiber === workInProgress2) {
                nextFiber = null;
                break;
              }
              fiber = nextFiber.sibling;
              if (null !== fiber) {
                fiber.return = nextFiber.return;
                nextFiber = fiber;
                break;
              }
              nextFiber = nextFiber.return;
            }
          fiber = nextFiber;
        }
      }
      function propagateParentContextChanges(current, workInProgress2, renderLanes2, forcePropagateEntireTree) {
        current = null;
        for (var parent = workInProgress2, isInsidePropagationBailout = false; null !== parent; ) {
          if (!isInsidePropagationBailout) {
            if (0 !== (parent.flags & 524288)) isInsidePropagationBailout = true;
            else if (0 !== (parent.flags & 262144)) break;
          }
          if (10 === parent.tag) {
            var currentParent = parent.alternate;
            if (null === currentParent) throw Error(formatProdErrorMessage(387));
            currentParent = currentParent.memoizedProps;
            if (null !== currentParent) {
              var context = parent.type;
              objectIs(parent.pendingProps.value, currentParent.value) || (null !== current ? current.push(context) : current = [context]);
            }
          } else if (parent === hostTransitionProviderCursor.current) {
            currentParent = parent.alternate;
            if (null === currentParent) throw Error(formatProdErrorMessage(387));
            currentParent.memoizedState.memoizedState !== parent.memoizedState.memoizedState && (null !== current ? current.push(HostTransitionContext) : current = [HostTransitionContext]);
          }
          parent = parent.return;
        }
        null !== current && propagateContextChanges(
          workInProgress2,
          current,
          renderLanes2,
          forcePropagateEntireTree
        );
        workInProgress2.flags |= 262144;
      }
      function checkIfContextChanged(currentDependencies) {
        for (currentDependencies = currentDependencies.firstContext; null !== currentDependencies; ) {
          if (!objectIs(
            currentDependencies.context._currentValue,
            currentDependencies.memoizedValue
          ))
            return true;
          currentDependencies = currentDependencies.next;
        }
        return false;
      }
      function prepareToReadContext(workInProgress2) {
        currentlyRenderingFiber$1 = workInProgress2;
        lastContextDependency = null;
        workInProgress2 = workInProgress2.dependencies;
        null !== workInProgress2 && (workInProgress2.firstContext = null);
      }
      function readContext(context) {
        return readContextForConsumer(currentlyRenderingFiber$1, context);
      }
      function readContextDuringReconciliation(consumer, context) {
        null === currentlyRenderingFiber$1 && prepareToReadContext(consumer);
        return readContextForConsumer(consumer, context);
      }
      function readContextForConsumer(consumer, context) {
        var value = context._currentValue;
        context = { context, memoizedValue: value, next: null };
        if (null === lastContextDependency) {
          if (null === consumer) throw Error(formatProdErrorMessage(308));
          lastContextDependency = context;
          consumer.dependencies = { lanes: 0, firstContext: context };
          consumer.flags |= 524288;
        } else lastContextDependency = lastContextDependency.next = context;
        return value;
      }
      var AbortControllerLocal = "undefined" !== typeof AbortController ? AbortController : function() {
        var listeners = [], signal = this.signal = {
          aborted: false,
          addEventListener: function(type, listener) {
            listeners.push(listener);
          }
        };
        this.abort = function() {
          signal.aborted = true;
          listeners.forEach(function(listener) {
            return listener();
          });
        };
      };
      var scheduleCallback$2 = Scheduler.unstable_scheduleCallback;
      var NormalPriority = Scheduler.unstable_NormalPriority;
      var CacheContext = {
        $$typeof: REACT_CONTEXT_TYPE,
        Consumer: null,
        Provider: null,
        _currentValue: null,
        _currentValue2: null,
        _threadCount: 0
      };
      function createCache() {
        return {
          controller: new AbortControllerLocal(),
          data: /* @__PURE__ */ new Map(),
          refCount: 0
        };
      }
      function releaseCache(cache) {
        cache.refCount--;
        0 === cache.refCount && scheduleCallback$2(NormalPriority, function() {
          cache.controller.abort();
        });
      }
      var currentEntangledListeners = null;
      var currentEntangledPendingCount = 0;
      var currentEntangledLane = 0;
      var currentEntangledActionThenable = null;
      function entangleAsyncAction(transition, thenable) {
        if (null === currentEntangledListeners) {
          var entangledListeners = currentEntangledListeners = [];
          currentEntangledPendingCount = 0;
          currentEntangledLane = requestTransitionLane();
          currentEntangledActionThenable = {
            status: "pending",
            value: void 0,
            then: function(resolve) {
              entangledListeners.push(resolve);
            }
          };
        }
        currentEntangledPendingCount++;
        thenable.then(pingEngtangledActionScope, pingEngtangledActionScope);
        return thenable;
      }
      function pingEngtangledActionScope() {
        if (0 === --currentEntangledPendingCount && null !== currentEntangledListeners) {
          null !== currentEntangledActionThenable && (currentEntangledActionThenable.status = "fulfilled");
          var listeners = currentEntangledListeners;
          currentEntangledListeners = null;
          currentEntangledLane = 0;
          currentEntangledActionThenable = null;
          for (var i = 0; i < listeners.length; i++) (0, listeners[i])();
        }
      }
      function chainThenableValue(thenable, result) {
        var listeners = [], thenableWithOverride = {
          status: "pending",
          value: null,
          reason: null,
          then: function(resolve) {
            listeners.push(resolve);
          }
        };
        thenable.then(
          function() {
            thenableWithOverride.status = "fulfilled";
            thenableWithOverride.value = result;
            for (var i = 0; i < listeners.length; i++) (0, listeners[i])(result);
          },
          function(error) {
            thenableWithOverride.status = "rejected";
            thenableWithOverride.reason = error;
            for (error = 0; error < listeners.length; error++)
              (0, listeners[error])(void 0);
          }
        );
        return thenableWithOverride;
      }
      var prevOnStartTransitionFinish = ReactSharedInternals.S;
      ReactSharedInternals.S = function(transition, returnValue) {
        globalMostRecentTransitionTime = now();
        "object" === typeof returnValue && null !== returnValue && "function" === typeof returnValue.then && entangleAsyncAction(transition, returnValue);
        null !== prevOnStartTransitionFinish && prevOnStartTransitionFinish(transition, returnValue);
      };
      var resumedCache = createCursor(null);
      function peekCacheFromPool() {
        var cacheResumedFromPreviousRender = resumedCache.current;
        return null !== cacheResumedFromPreviousRender ? cacheResumedFromPreviousRender : workInProgressRoot.pooledCache;
      }
      function pushTransition(offscreenWorkInProgress, prevCachePool) {
        null === prevCachePool ? push(resumedCache, resumedCache.current) : push(resumedCache, prevCachePool.pool);
      }
      function getSuspendedCache() {
        var cacheFromPool = peekCacheFromPool();
        return null === cacheFromPool ? null : { parent: CacheContext._currentValue, pool: cacheFromPool };
      }
      var SuspenseException = Error(formatProdErrorMessage(460));
      var SuspenseyCommitException = Error(formatProdErrorMessage(474));
      var SuspenseActionException = Error(formatProdErrorMessage(542));
      var noopSuspenseyCommitThenable = { then: function() {
      } };
      function isThenableResolved(thenable) {
        thenable = thenable.status;
        return "fulfilled" === thenable || "rejected" === thenable;
      }
      function trackUsedThenable(thenableState2, thenable, index2) {
        index2 = thenableState2[index2];
        void 0 === index2 ? thenableState2.push(thenable) : index2 !== thenable && (thenable.then(noop$1, noop$1), thenable = index2);
        switch (thenable.status) {
          case "fulfilled":
            return thenable.value;
          case "rejected":
            throw thenableState2 = thenable.reason, checkIfUseWrappedInAsyncCatch(thenableState2), thenableState2;
          default:
            if ("string" === typeof thenable.status) thenable.then(noop$1, noop$1);
            else {
              thenableState2 = workInProgressRoot;
              if (null !== thenableState2 && 100 < thenableState2.shellSuspendCounter)
                throw Error(formatProdErrorMessage(482));
              thenableState2 = thenable;
              thenableState2.status = "pending";
              thenableState2.then(
                function(fulfilledValue) {
                  if ("pending" === thenable.status) {
                    var fulfilledThenable = thenable;
                    fulfilledThenable.status = "fulfilled";
                    fulfilledThenable.value = fulfilledValue;
                  }
                },
                function(error) {
                  if ("pending" === thenable.status) {
                    var rejectedThenable = thenable;
                    rejectedThenable.status = "rejected";
                    rejectedThenable.reason = error;
                  }
                }
              );
            }
            switch (thenable.status) {
              case "fulfilled":
                return thenable.value;
              case "rejected":
                throw thenableState2 = thenable.reason, checkIfUseWrappedInAsyncCatch(thenableState2), thenableState2;
            }
            suspendedThenable = thenable;
            throw SuspenseException;
        }
      }
      function resolveLazy(lazyType) {
        try {
          var init = lazyType._init;
          return init(lazyType._payload);
        } catch (x) {
          if (null !== x && "object" === typeof x && "function" === typeof x.then)
            throw suspendedThenable = x, SuspenseException;
          throw x;
        }
      }
      var suspendedThenable = null;
      function getSuspendedThenable() {
        if (null === suspendedThenable) throw Error(formatProdErrorMessage(459));
        var thenable = suspendedThenable;
        suspendedThenable = null;
        return thenable;
      }
      function checkIfUseWrappedInAsyncCatch(rejectedReason) {
        if (rejectedReason === SuspenseException || rejectedReason === SuspenseActionException)
          throw Error(formatProdErrorMessage(483));
      }
      var thenableState$1 = null;
      var thenableIndexCounter$1 = 0;
      function unwrapThenable(thenable) {
        var index2 = thenableIndexCounter$1;
        thenableIndexCounter$1 += 1;
        null === thenableState$1 && (thenableState$1 = []);
        return trackUsedThenable(thenableState$1, thenable, index2);
      }
      function coerceRef(workInProgress2, element) {
        element = element.props.ref;
        workInProgress2.ref = void 0 !== element ? element : null;
      }
      function throwOnInvalidObjectTypeImpl(returnFiber, newChild) {
        if (newChild.$$typeof === REACT_LEGACY_ELEMENT_TYPE)
          throw Error(formatProdErrorMessage(525));
        returnFiber = Object.prototype.toString.call(newChild);
        throw Error(
          formatProdErrorMessage(
            31,
            "[object Object]" === returnFiber ? "object with keys {" + Object.keys(newChild).join(", ") + "}" : returnFiber
          )
        );
      }
      function createChildReconciler(shouldTrackSideEffects) {
        function deleteChild(returnFiber, childToDelete) {
          if (shouldTrackSideEffects) {
            var deletions = returnFiber.deletions;
            null === deletions ? (returnFiber.deletions = [childToDelete], returnFiber.flags |= 16) : deletions.push(childToDelete);
          }
        }
        function deleteRemainingChildren(returnFiber, currentFirstChild) {
          if (!shouldTrackSideEffects) return null;
          for (; null !== currentFirstChild; )
            deleteChild(returnFiber, currentFirstChild), currentFirstChild = currentFirstChild.sibling;
          return null;
        }
        function mapRemainingChildren(currentFirstChild) {
          for (var existingChildren = /* @__PURE__ */ new Map(); null !== currentFirstChild; )
            null !== currentFirstChild.key ? existingChildren.set(currentFirstChild.key, currentFirstChild) : existingChildren.set(currentFirstChild.index, currentFirstChild), currentFirstChild = currentFirstChild.sibling;
          return existingChildren;
        }
        function useFiber(fiber, pendingProps) {
          fiber = createWorkInProgress(fiber, pendingProps);
          fiber.index = 0;
          fiber.sibling = null;
          return fiber;
        }
        function placeChild(newFiber, lastPlacedIndex, newIndex) {
          newFiber.index = newIndex;
          if (!shouldTrackSideEffects)
            return newFiber.flags |= 1048576, lastPlacedIndex;
          newIndex = newFiber.alternate;
          if (null !== newIndex)
            return newIndex = newIndex.index, newIndex < lastPlacedIndex ? (newFiber.flags |= 67108866, lastPlacedIndex) : newIndex;
          newFiber.flags |= 67108866;
          return lastPlacedIndex;
        }
        function placeSingleChild(newFiber) {
          shouldTrackSideEffects && null === newFiber.alternate && (newFiber.flags |= 67108866);
          return newFiber;
        }
        function updateTextNode(returnFiber, current, textContent, lanes) {
          if (null === current || 6 !== current.tag)
            return current = createFiberFromText(textContent, returnFiber.mode, lanes), current.return = returnFiber, current;
          current = useFiber(current, textContent);
          current.return = returnFiber;
          return current;
        }
        function updateElement(returnFiber, current, element, lanes) {
          var elementType = element.type;
          if (elementType === REACT_FRAGMENT_TYPE)
            return updateFragment(
              returnFiber,
              current,
              element.props.children,
              lanes,
              element.key
            );
          if (null !== current && (current.elementType === elementType || "object" === typeof elementType && null !== elementType && elementType.$$typeof === REACT_LAZY_TYPE && resolveLazy(elementType) === current.type))
            return current = useFiber(current, element.props), coerceRef(current, element), current.return = returnFiber, current;
          current = createFiberFromTypeAndProps(
            element.type,
            element.key,
            element.props,
            null,
            returnFiber.mode,
            lanes
          );
          coerceRef(current, element);
          current.return = returnFiber;
          return current;
        }
        function updatePortal(returnFiber, current, portal, lanes) {
          if (null === current || 4 !== current.tag || current.stateNode.containerInfo !== portal.containerInfo || current.stateNode.implementation !== portal.implementation)
            return current = createFiberFromPortal(portal, returnFiber.mode, lanes), current.return = returnFiber, current;
          current = useFiber(current, portal.children || []);
          current.return = returnFiber;
          return current;
        }
        function updateFragment(returnFiber, current, fragment, lanes, key) {
          if (null === current || 7 !== current.tag)
            return current = createFiberFromFragment(
              fragment,
              returnFiber.mode,
              lanes,
              key
            ), current.return = returnFiber, current;
          current = useFiber(current, fragment);
          current.return = returnFiber;
          return current;
        }
        function createChild(returnFiber, newChild, lanes) {
          if ("string" === typeof newChild && "" !== newChild || "number" === typeof newChild || "bigint" === typeof newChild)
            return newChild = createFiberFromText(
              "" + newChild,
              returnFiber.mode,
              lanes
            ), newChild.return = returnFiber, newChild;
          if ("object" === typeof newChild && null !== newChild) {
            switch (newChild.$$typeof) {
              case REACT_ELEMENT_TYPE:
                return lanes = createFiberFromTypeAndProps(
                  newChild.type,
                  newChild.key,
                  newChild.props,
                  null,
                  returnFiber.mode,
                  lanes
                ), coerceRef(lanes, newChild), lanes.return = returnFiber, lanes;
              case REACT_PORTAL_TYPE:
                return newChild = createFiberFromPortal(
                  newChild,
                  returnFiber.mode,
                  lanes
                ), newChild.return = returnFiber, newChild;
              case REACT_LAZY_TYPE:
                return newChild = resolveLazy(newChild), createChild(returnFiber, newChild, lanes);
            }
            if (isArrayImpl(newChild) || getIteratorFn(newChild))
              return newChild = createFiberFromFragment(
                newChild,
                returnFiber.mode,
                lanes,
                null
              ), newChild.return = returnFiber, newChild;
            if ("function" === typeof newChild.then)
              return createChild(returnFiber, unwrapThenable(newChild), lanes);
            if (newChild.$$typeof === REACT_CONTEXT_TYPE)
              return createChild(
                returnFiber,
                readContextDuringReconciliation(returnFiber, newChild),
                lanes
              );
            throwOnInvalidObjectTypeImpl(returnFiber, newChild);
          }
          return null;
        }
        function updateSlot(returnFiber, oldFiber, newChild, lanes) {
          var key = null !== oldFiber ? oldFiber.key : null;
          if ("string" === typeof newChild && "" !== newChild || "number" === typeof newChild || "bigint" === typeof newChild)
            return null !== key ? null : updateTextNode(returnFiber, oldFiber, "" + newChild, lanes);
          if ("object" === typeof newChild && null !== newChild) {
            switch (newChild.$$typeof) {
              case REACT_ELEMENT_TYPE:
                return newChild.key === key ? updateElement(returnFiber, oldFiber, newChild, lanes) : null;
              case REACT_PORTAL_TYPE:
                return newChild.key === key ? updatePortal(returnFiber, oldFiber, newChild, lanes) : null;
              case REACT_LAZY_TYPE:
                return newChild = resolveLazy(newChild), updateSlot(returnFiber, oldFiber, newChild, lanes);
            }
            if (isArrayImpl(newChild) || getIteratorFn(newChild))
              return null !== key ? null : updateFragment(returnFiber, oldFiber, newChild, lanes, null);
            if ("function" === typeof newChild.then)
              return updateSlot(
                returnFiber,
                oldFiber,
                unwrapThenable(newChild),
                lanes
              );
            if (newChild.$$typeof === REACT_CONTEXT_TYPE)
              return updateSlot(
                returnFiber,
                oldFiber,
                readContextDuringReconciliation(returnFiber, newChild),
                lanes
              );
            throwOnInvalidObjectTypeImpl(returnFiber, newChild);
          }
          return null;
        }
        function updateFromMap(existingChildren, returnFiber, newIdx, newChild, lanes) {
          if ("string" === typeof newChild && "" !== newChild || "number" === typeof newChild || "bigint" === typeof newChild)
            return existingChildren = existingChildren.get(newIdx) || null, updateTextNode(returnFiber, existingChildren, "" + newChild, lanes);
          if ("object" === typeof newChild && null !== newChild) {
            switch (newChild.$$typeof) {
              case REACT_ELEMENT_TYPE:
                return existingChildren = existingChildren.get(
                  null === newChild.key ? newIdx : newChild.key
                ) || null, updateElement(returnFiber, existingChildren, newChild, lanes);
              case REACT_PORTAL_TYPE:
                return existingChildren = existingChildren.get(
                  null === newChild.key ? newIdx : newChild.key
                ) || null, updatePortal(returnFiber, existingChildren, newChild, lanes);
              case REACT_LAZY_TYPE:
                return newChild = resolveLazy(newChild), updateFromMap(
                  existingChildren,
                  returnFiber,
                  newIdx,
                  newChild,
                  lanes
                );
            }
            if (isArrayImpl(newChild) || getIteratorFn(newChild))
              return existingChildren = existingChildren.get(newIdx) || null, updateFragment(returnFiber, existingChildren, newChild, lanes, null);
            if ("function" === typeof newChild.then)
              return updateFromMap(
                existingChildren,
                returnFiber,
                newIdx,
                unwrapThenable(newChild),
                lanes
              );
            if (newChild.$$typeof === REACT_CONTEXT_TYPE)
              return updateFromMap(
                existingChildren,
                returnFiber,
                newIdx,
                readContextDuringReconciliation(returnFiber, newChild),
                lanes
              );
            throwOnInvalidObjectTypeImpl(returnFiber, newChild);
          }
          return null;
        }
        function reconcileChildrenArray(returnFiber, currentFirstChild, newChildren, lanes) {
          for (var resultingFirstChild = null, previousNewFiber = null, oldFiber = currentFirstChild, newIdx = currentFirstChild = 0, nextOldFiber = null; null !== oldFiber && newIdx < newChildren.length; newIdx++) {
            oldFiber.index > newIdx ? (nextOldFiber = oldFiber, oldFiber = null) : nextOldFiber = oldFiber.sibling;
            var newFiber = updateSlot(
              returnFiber,
              oldFiber,
              newChildren[newIdx],
              lanes
            );
            if (null === newFiber) {
              null === oldFiber && (oldFiber = nextOldFiber);
              break;
            }
            shouldTrackSideEffects && oldFiber && null === newFiber.alternate && deleteChild(returnFiber, oldFiber);
            currentFirstChild = placeChild(newFiber, currentFirstChild, newIdx);
            null === previousNewFiber ? resultingFirstChild = newFiber : previousNewFiber.sibling = newFiber;
            previousNewFiber = newFiber;
            oldFiber = nextOldFiber;
          }
          if (newIdx === newChildren.length)
            return deleteRemainingChildren(returnFiber, oldFiber), isHydrating && pushTreeFork(returnFiber, newIdx), resultingFirstChild;
          if (null === oldFiber) {
            for (; newIdx < newChildren.length; newIdx++)
              oldFiber = createChild(returnFiber, newChildren[newIdx], lanes), null !== oldFiber && (currentFirstChild = placeChild(
                oldFiber,
                currentFirstChild,
                newIdx
              ), null === previousNewFiber ? resultingFirstChild = oldFiber : previousNewFiber.sibling = oldFiber, previousNewFiber = oldFiber);
            isHydrating && pushTreeFork(returnFiber, newIdx);
            return resultingFirstChild;
          }
          for (oldFiber = mapRemainingChildren(oldFiber); newIdx < newChildren.length; newIdx++)
            nextOldFiber = updateFromMap(
              oldFiber,
              returnFiber,
              newIdx,
              newChildren[newIdx],
              lanes
            ), null !== nextOldFiber && (shouldTrackSideEffects && null !== nextOldFiber.alternate && oldFiber.delete(
              null === nextOldFiber.key ? newIdx : nextOldFiber.key
            ), currentFirstChild = placeChild(
              nextOldFiber,
              currentFirstChild,
              newIdx
            ), null === previousNewFiber ? resultingFirstChild = nextOldFiber : previousNewFiber.sibling = nextOldFiber, previousNewFiber = nextOldFiber);
          shouldTrackSideEffects && oldFiber.forEach(function(child) {
            return deleteChild(returnFiber, child);
          });
          isHydrating && pushTreeFork(returnFiber, newIdx);
          return resultingFirstChild;
        }
        function reconcileChildrenIterator(returnFiber, currentFirstChild, newChildren, lanes) {
          if (null == newChildren) throw Error(formatProdErrorMessage(151));
          for (var resultingFirstChild = null, previousNewFiber = null, oldFiber = currentFirstChild, newIdx = currentFirstChild = 0, nextOldFiber = null, step = newChildren.next(); null !== oldFiber && !step.done; newIdx++, step = newChildren.next()) {
            oldFiber.index > newIdx ? (nextOldFiber = oldFiber, oldFiber = null) : nextOldFiber = oldFiber.sibling;
            var newFiber = updateSlot(returnFiber, oldFiber, step.value, lanes);
            if (null === newFiber) {
              null === oldFiber && (oldFiber = nextOldFiber);
              break;
            }
            shouldTrackSideEffects && oldFiber && null === newFiber.alternate && deleteChild(returnFiber, oldFiber);
            currentFirstChild = placeChild(newFiber, currentFirstChild, newIdx);
            null === previousNewFiber ? resultingFirstChild = newFiber : previousNewFiber.sibling = newFiber;
            previousNewFiber = newFiber;
            oldFiber = nextOldFiber;
          }
          if (step.done)
            return deleteRemainingChildren(returnFiber, oldFiber), isHydrating && pushTreeFork(returnFiber, newIdx), resultingFirstChild;
          if (null === oldFiber) {
            for (; !step.done; newIdx++, step = newChildren.next())
              step = createChild(returnFiber, step.value, lanes), null !== step && (currentFirstChild = placeChild(step, currentFirstChild, newIdx), null === previousNewFiber ? resultingFirstChild = step : previousNewFiber.sibling = step, previousNewFiber = step);
            isHydrating && pushTreeFork(returnFiber, newIdx);
            return resultingFirstChild;
          }
          for (oldFiber = mapRemainingChildren(oldFiber); !step.done; newIdx++, step = newChildren.next())
            step = updateFromMap(oldFiber, returnFiber, newIdx, step.value, lanes), null !== step && (shouldTrackSideEffects && null !== step.alternate && oldFiber.delete(null === step.key ? newIdx : step.key), currentFirstChild = placeChild(step, currentFirstChild, newIdx), null === previousNewFiber ? resultingFirstChild = step : previousNewFiber.sibling = step, previousNewFiber = step);
          shouldTrackSideEffects && oldFiber.forEach(function(child) {
            return deleteChild(returnFiber, child);
          });
          isHydrating && pushTreeFork(returnFiber, newIdx);
          return resultingFirstChild;
        }
        function reconcileChildFibersImpl(returnFiber, currentFirstChild, newChild, lanes) {
          "object" === typeof newChild && null !== newChild && newChild.type === REACT_FRAGMENT_TYPE && null === newChild.key && (newChild = newChild.props.children);
          if ("object" === typeof newChild && null !== newChild) {
            switch (newChild.$$typeof) {
              case REACT_ELEMENT_TYPE:
                a: {
                  for (var key = newChild.key; null !== currentFirstChild; ) {
                    if (currentFirstChild.key === key) {
                      key = newChild.type;
                      if (key === REACT_FRAGMENT_TYPE) {
                        if (7 === currentFirstChild.tag) {
                          deleteRemainingChildren(
                            returnFiber,
                            currentFirstChild.sibling
                          );
                          lanes = useFiber(
                            currentFirstChild,
                            newChild.props.children
                          );
                          lanes.return = returnFiber;
                          returnFiber = lanes;
                          break a;
                        }
                      } else if (currentFirstChild.elementType === key || "object" === typeof key && null !== key && key.$$typeof === REACT_LAZY_TYPE && resolveLazy(key) === currentFirstChild.type) {
                        deleteRemainingChildren(
                          returnFiber,
                          currentFirstChild.sibling
                        );
                        lanes = useFiber(currentFirstChild, newChild.props);
                        coerceRef(lanes, newChild);
                        lanes.return = returnFiber;
                        returnFiber = lanes;
                        break a;
                      }
                      deleteRemainingChildren(returnFiber, currentFirstChild);
                      break;
                    } else deleteChild(returnFiber, currentFirstChild);
                    currentFirstChild = currentFirstChild.sibling;
                  }
                  newChild.type === REACT_FRAGMENT_TYPE ? (lanes = createFiberFromFragment(
                    newChild.props.children,
                    returnFiber.mode,
                    lanes,
                    newChild.key
                  ), lanes.return = returnFiber, returnFiber = lanes) : (lanes = createFiberFromTypeAndProps(
                    newChild.type,
                    newChild.key,
                    newChild.props,
                    null,
                    returnFiber.mode,
                    lanes
                  ), coerceRef(lanes, newChild), lanes.return = returnFiber, returnFiber = lanes);
                }
                return placeSingleChild(returnFiber);
              case REACT_PORTAL_TYPE:
                a: {
                  for (key = newChild.key; null !== currentFirstChild; ) {
                    if (currentFirstChild.key === key)
                      if (4 === currentFirstChild.tag && currentFirstChild.stateNode.containerInfo === newChild.containerInfo && currentFirstChild.stateNode.implementation === newChild.implementation) {
                        deleteRemainingChildren(
                          returnFiber,
                          currentFirstChild.sibling
                        );
                        lanes = useFiber(currentFirstChild, newChild.children || []);
                        lanes.return = returnFiber;
                        returnFiber = lanes;
                        break a;
                      } else {
                        deleteRemainingChildren(returnFiber, currentFirstChild);
                        break;
                      }
                    else deleteChild(returnFiber, currentFirstChild);
                    currentFirstChild = currentFirstChild.sibling;
                  }
                  lanes = createFiberFromPortal(newChild, returnFiber.mode, lanes);
                  lanes.return = returnFiber;
                  returnFiber = lanes;
                }
                return placeSingleChild(returnFiber);
              case REACT_LAZY_TYPE:
                return newChild = resolveLazy(newChild), reconcileChildFibersImpl(
                  returnFiber,
                  currentFirstChild,
                  newChild,
                  lanes
                );
            }
            if (isArrayImpl(newChild))
              return reconcileChildrenArray(
                returnFiber,
                currentFirstChild,
                newChild,
                lanes
              );
            if (getIteratorFn(newChild)) {
              key = getIteratorFn(newChild);
              if ("function" !== typeof key) throw Error(formatProdErrorMessage(150));
              newChild = key.call(newChild);
              return reconcileChildrenIterator(
                returnFiber,
                currentFirstChild,
                newChild,
                lanes
              );
            }
            if ("function" === typeof newChild.then)
              return reconcileChildFibersImpl(
                returnFiber,
                currentFirstChild,
                unwrapThenable(newChild),
                lanes
              );
            if (newChild.$$typeof === REACT_CONTEXT_TYPE)
              return reconcileChildFibersImpl(
                returnFiber,
                currentFirstChild,
                readContextDuringReconciliation(returnFiber, newChild),
                lanes
              );
            throwOnInvalidObjectTypeImpl(returnFiber, newChild);
          }
          return "string" === typeof newChild && "" !== newChild || "number" === typeof newChild || "bigint" === typeof newChild ? (newChild = "" + newChild, null !== currentFirstChild && 6 === currentFirstChild.tag ? (deleteRemainingChildren(returnFiber, currentFirstChild.sibling), lanes = useFiber(currentFirstChild, newChild), lanes.return = returnFiber, returnFiber = lanes) : (deleteRemainingChildren(returnFiber, currentFirstChild), lanes = createFiberFromText(newChild, returnFiber.mode, lanes), lanes.return = returnFiber, returnFiber = lanes), placeSingleChild(returnFiber)) : deleteRemainingChildren(returnFiber, currentFirstChild);
        }
        return function(returnFiber, currentFirstChild, newChild, lanes) {
          try {
            thenableIndexCounter$1 = 0;
            var firstChildFiber = reconcileChildFibersImpl(
              returnFiber,
              currentFirstChild,
              newChild,
              lanes
            );
            thenableState$1 = null;
            return firstChildFiber;
          } catch (x) {
            if (x === SuspenseException || x === SuspenseActionException) throw x;
            var fiber = createFiberImplClass(29, x, null, returnFiber.mode);
            fiber.lanes = lanes;
            fiber.return = returnFiber;
            return fiber;
          } finally {
          }
        };
      }
      var reconcileChildFibers = createChildReconciler(true);
      var mountChildFibers = createChildReconciler(false);
      var hasForceUpdate = false;
      function initializeUpdateQueue(fiber) {
        fiber.updateQueue = {
          baseState: fiber.memoizedState,
          firstBaseUpdate: null,
          lastBaseUpdate: null,
          shared: { pending: null, lanes: 0, hiddenCallbacks: null },
          callbacks: null
        };
      }
      function cloneUpdateQueue(current, workInProgress2) {
        current = current.updateQueue;
        workInProgress2.updateQueue === current && (workInProgress2.updateQueue = {
          baseState: current.baseState,
          firstBaseUpdate: current.firstBaseUpdate,
          lastBaseUpdate: current.lastBaseUpdate,
          shared: current.shared,
          callbacks: null
        });
      }
      function createUpdate(lane) {
        return { lane, tag: 0, payload: null, callback: null, next: null };
      }
      function enqueueUpdate(fiber, update, lane) {
        var updateQueue = fiber.updateQueue;
        if (null === updateQueue) return null;
        updateQueue = updateQueue.shared;
        if (0 !== (executionContext & 2)) {
          var pending = updateQueue.pending;
          null === pending ? update.next = update : (update.next = pending.next, pending.next = update);
          updateQueue.pending = update;
          update = getRootForUpdatedFiber(fiber);
          markUpdateLaneFromFiberToRoot(fiber, null, lane);
          return update;
        }
        enqueueUpdate$1(fiber, updateQueue, update, lane);
        return getRootForUpdatedFiber(fiber);
      }
      function entangleTransitions(root2, fiber, lane) {
        fiber = fiber.updateQueue;
        if (null !== fiber && (fiber = fiber.shared, 0 !== (lane & 4194048))) {
          var queueLanes = fiber.lanes;
          queueLanes &= root2.pendingLanes;
          lane |= queueLanes;
          fiber.lanes = lane;
          markRootEntangled(root2, lane);
        }
      }
      function enqueueCapturedUpdate(workInProgress2, capturedUpdate) {
        var queue = workInProgress2.updateQueue, current = workInProgress2.alternate;
        if (null !== current && (current = current.updateQueue, queue === current)) {
          var newFirst = null, newLast = null;
          queue = queue.firstBaseUpdate;
          if (null !== queue) {
            do {
              var clone = {
                lane: queue.lane,
                tag: queue.tag,
                payload: queue.payload,
                callback: null,
                next: null
              };
              null === newLast ? newFirst = newLast = clone : newLast = newLast.next = clone;
              queue = queue.next;
            } while (null !== queue);
            null === newLast ? newFirst = newLast = capturedUpdate : newLast = newLast.next = capturedUpdate;
          } else newFirst = newLast = capturedUpdate;
          queue = {
            baseState: current.baseState,
            firstBaseUpdate: newFirst,
            lastBaseUpdate: newLast,
            shared: current.shared,
            callbacks: current.callbacks
          };
          workInProgress2.updateQueue = queue;
          return;
        }
        workInProgress2 = queue.lastBaseUpdate;
        null === workInProgress2 ? queue.firstBaseUpdate = capturedUpdate : workInProgress2.next = capturedUpdate;
        queue.lastBaseUpdate = capturedUpdate;
      }
      var didReadFromEntangledAsyncAction = false;
      function suspendIfUpdateReadFromEntangledAsyncAction() {
        if (didReadFromEntangledAsyncAction) {
          var entangledActionThenable = currentEntangledActionThenable;
          if (null !== entangledActionThenable) throw entangledActionThenable;
        }
      }
      function processUpdateQueue(workInProgress$jscomp$0, props, instance$jscomp$0, renderLanes2) {
        didReadFromEntangledAsyncAction = false;
        var queue = workInProgress$jscomp$0.updateQueue;
        hasForceUpdate = false;
        var firstBaseUpdate = queue.firstBaseUpdate, lastBaseUpdate = queue.lastBaseUpdate, pendingQueue = queue.shared.pending;
        if (null !== pendingQueue) {
          queue.shared.pending = null;
          var lastPendingUpdate = pendingQueue, firstPendingUpdate = lastPendingUpdate.next;
          lastPendingUpdate.next = null;
          null === lastBaseUpdate ? firstBaseUpdate = firstPendingUpdate : lastBaseUpdate.next = firstPendingUpdate;
          lastBaseUpdate = lastPendingUpdate;
          var current = workInProgress$jscomp$0.alternate;
          null !== current && (current = current.updateQueue, pendingQueue = current.lastBaseUpdate, pendingQueue !== lastBaseUpdate && (null === pendingQueue ? current.firstBaseUpdate = firstPendingUpdate : pendingQueue.next = firstPendingUpdate, current.lastBaseUpdate = lastPendingUpdate));
        }
        if (null !== firstBaseUpdate) {
          var newState = queue.baseState;
          lastBaseUpdate = 0;
          current = firstPendingUpdate = lastPendingUpdate = null;
          pendingQueue = firstBaseUpdate;
          do {
            var updateLane = pendingQueue.lane & -536870913, isHiddenUpdate = updateLane !== pendingQueue.lane;
            if (isHiddenUpdate ? (workInProgressRootRenderLanes & updateLane) === updateLane : (renderLanes2 & updateLane) === updateLane) {
              0 !== updateLane && updateLane === currentEntangledLane && (didReadFromEntangledAsyncAction = true);
              null !== current && (current = current.next = {
                lane: 0,
                tag: pendingQueue.tag,
                payload: pendingQueue.payload,
                callback: null,
                next: null
              });
              a: {
                var workInProgress2 = workInProgress$jscomp$0, update = pendingQueue;
                updateLane = props;
                var instance = instance$jscomp$0;
                switch (update.tag) {
                  case 1:
                    workInProgress2 = update.payload;
                    if ("function" === typeof workInProgress2) {
                      newState = workInProgress2.call(instance, newState, updateLane);
                      break a;
                    }
                    newState = workInProgress2;
                    break a;
                  case 3:
                    workInProgress2.flags = workInProgress2.flags & -65537 | 128;
                  case 0:
                    workInProgress2 = update.payload;
                    updateLane = "function" === typeof workInProgress2 ? workInProgress2.call(instance, newState, updateLane) : workInProgress2;
                    if (null === updateLane || void 0 === updateLane) break a;
                    newState = assign({}, newState, updateLane);
                    break a;
                  case 2:
                    hasForceUpdate = true;
                }
              }
              updateLane = pendingQueue.callback;
              null !== updateLane && (workInProgress$jscomp$0.flags |= 64, isHiddenUpdate && (workInProgress$jscomp$0.flags |= 8192), isHiddenUpdate = queue.callbacks, null === isHiddenUpdate ? queue.callbacks = [updateLane] : isHiddenUpdate.push(updateLane));
            } else
              isHiddenUpdate = {
                lane: updateLane,
                tag: pendingQueue.tag,
                payload: pendingQueue.payload,
                callback: pendingQueue.callback,
                next: null
              }, null === current ? (firstPendingUpdate = current = isHiddenUpdate, lastPendingUpdate = newState) : current = current.next = isHiddenUpdate, lastBaseUpdate |= updateLane;
            pendingQueue = pendingQueue.next;
            if (null === pendingQueue)
              if (pendingQueue = queue.shared.pending, null === pendingQueue)
                break;
              else
                isHiddenUpdate = pendingQueue, pendingQueue = isHiddenUpdate.next, isHiddenUpdate.next = null, queue.lastBaseUpdate = isHiddenUpdate, queue.shared.pending = null;
          } while (1);
          null === current && (lastPendingUpdate = newState);
          queue.baseState = lastPendingUpdate;
          queue.firstBaseUpdate = firstPendingUpdate;
          queue.lastBaseUpdate = current;
          null === firstBaseUpdate && (queue.shared.lanes = 0);
          workInProgressRootSkippedLanes |= lastBaseUpdate;
          workInProgress$jscomp$0.lanes = lastBaseUpdate;
          workInProgress$jscomp$0.memoizedState = newState;
        }
      }
      function callCallback(callback, context) {
        if ("function" !== typeof callback)
          throw Error(formatProdErrorMessage(191, callback));
        callback.call(context);
      }
      function commitCallbacks(updateQueue, context) {
        var callbacks = updateQueue.callbacks;
        if (null !== callbacks)
          for (updateQueue.callbacks = null, updateQueue = 0; updateQueue < callbacks.length; updateQueue++)
            callCallback(callbacks[updateQueue], context);
      }
      var currentTreeHiddenStackCursor = createCursor(null);
      var prevEntangledRenderLanesCursor = createCursor(0);
      function pushHiddenContext(fiber, context) {
        fiber = entangledRenderLanes;
        push(prevEntangledRenderLanesCursor, fiber);
        push(currentTreeHiddenStackCursor, context);
        entangledRenderLanes = fiber | context.baseLanes;
      }
      function reuseHiddenContextOnStack() {
        push(prevEntangledRenderLanesCursor, entangledRenderLanes);
        push(currentTreeHiddenStackCursor, currentTreeHiddenStackCursor.current);
      }
      function popHiddenContext() {
        entangledRenderLanes = prevEntangledRenderLanesCursor.current;
        pop(currentTreeHiddenStackCursor);
        pop(prevEntangledRenderLanesCursor);
      }
      var suspenseHandlerStackCursor = createCursor(null);
      var shellBoundary = null;
      function pushPrimaryTreeSuspenseHandler(handler) {
        var current = handler.alternate;
        push(suspenseStackCursor, suspenseStackCursor.current & 1);
        push(suspenseHandlerStackCursor, handler);
        null === shellBoundary && (null === current || null !== currentTreeHiddenStackCursor.current ? shellBoundary = handler : null !== current.memoizedState && (shellBoundary = handler));
      }
      function pushDehydratedActivitySuspenseHandler(fiber) {
        push(suspenseStackCursor, suspenseStackCursor.current);
        push(suspenseHandlerStackCursor, fiber);
        null === shellBoundary && (shellBoundary = fiber);
      }
      function pushOffscreenSuspenseHandler(fiber) {
        22 === fiber.tag ? (push(suspenseStackCursor, suspenseStackCursor.current), push(suspenseHandlerStackCursor, fiber), null === shellBoundary && (shellBoundary = fiber)) : reuseSuspenseHandlerOnStack(fiber);
      }
      function reuseSuspenseHandlerOnStack() {
        push(suspenseStackCursor, suspenseStackCursor.current);
        push(suspenseHandlerStackCursor, suspenseHandlerStackCursor.current);
      }
      function popSuspenseHandler(fiber) {
        pop(suspenseHandlerStackCursor);
        shellBoundary === fiber && (shellBoundary = null);
        pop(suspenseStackCursor);
      }
      var suspenseStackCursor = createCursor(0);
      function findFirstSuspended(row) {
        for (var node = row; null !== node; ) {
          if (13 === node.tag) {
            var state = node.memoizedState;
            if (null !== state && (state = state.dehydrated, null === state || isSuspenseInstancePending(state) || isSuspenseInstanceFallback(state)))
              return node;
          } else if (19 === node.tag && ("forwards" === node.memoizedProps.revealOrder || "backwards" === node.memoizedProps.revealOrder || "unstable_legacy-backwards" === node.memoizedProps.revealOrder || "together" === node.memoizedProps.revealOrder)) {
            if (0 !== (node.flags & 128)) return node;
          } else if (null !== node.child) {
            node.child.return = node;
            node = node.child;
            continue;
          }
          if (node === row) break;
          for (; null === node.sibling; ) {
            if (null === node.return || node.return === row) return null;
            node = node.return;
          }
          node.sibling.return = node.return;
          node = node.sibling;
        }
        return null;
      }
      var renderLanes = 0;
      var currentlyRenderingFiber = null;
      var currentHook = null;
      var workInProgressHook = null;
      var didScheduleRenderPhaseUpdate = false;
      var didScheduleRenderPhaseUpdateDuringThisPass = false;
      var shouldDoubleInvokeUserFnsInHooksDEV = false;
      var localIdCounter = 0;
      var thenableIndexCounter = 0;
      var thenableState = null;
      var globalClientIdCounter = 0;
      function throwInvalidHookError() {
        throw Error(formatProdErrorMessage(321));
      }
      function areHookInputsEqual(nextDeps, prevDeps) {
        if (null === prevDeps) return false;
        for (var i = 0; i < prevDeps.length && i < nextDeps.length; i++)
          if (!objectIs(nextDeps[i], prevDeps[i])) return false;
        return true;
      }
      function renderWithHooks(current, workInProgress2, Component, props, secondArg, nextRenderLanes) {
        renderLanes = nextRenderLanes;
        currentlyRenderingFiber = workInProgress2;
        workInProgress2.memoizedState = null;
        workInProgress2.updateQueue = null;
        workInProgress2.lanes = 0;
        ReactSharedInternals.H = null === current || null === current.memoizedState ? HooksDispatcherOnMount : HooksDispatcherOnUpdate;
        shouldDoubleInvokeUserFnsInHooksDEV = false;
        nextRenderLanes = Component(props, secondArg);
        shouldDoubleInvokeUserFnsInHooksDEV = false;
        didScheduleRenderPhaseUpdateDuringThisPass && (nextRenderLanes = renderWithHooksAgain(
          workInProgress2,
          Component,
          props,
          secondArg
        ));
        finishRenderingHooks(current);
        return nextRenderLanes;
      }
      function finishRenderingHooks(current) {
        ReactSharedInternals.H = ContextOnlyDispatcher;
        var didRenderTooFewHooks = null !== currentHook && null !== currentHook.next;
        renderLanes = 0;
        workInProgressHook = currentHook = currentlyRenderingFiber = null;
        didScheduleRenderPhaseUpdate = false;
        thenableIndexCounter = 0;
        thenableState = null;
        if (didRenderTooFewHooks) throw Error(formatProdErrorMessage(300));
        null === current || didReceiveUpdate || (current = current.dependencies, null !== current && checkIfContextChanged(current) && (didReceiveUpdate = true));
      }
      function renderWithHooksAgain(workInProgress2, Component, props, secondArg) {
        currentlyRenderingFiber = workInProgress2;
        var numberOfReRenders = 0;
        do {
          didScheduleRenderPhaseUpdateDuringThisPass && (thenableState = null);
          thenableIndexCounter = 0;
          didScheduleRenderPhaseUpdateDuringThisPass = false;
          if (25 <= numberOfReRenders) throw Error(formatProdErrorMessage(301));
          numberOfReRenders += 1;
          workInProgressHook = currentHook = null;
          if (null != workInProgress2.updateQueue) {
            var children = workInProgress2.updateQueue;
            children.lastEffect = null;
            children.events = null;
            children.stores = null;
            null != children.memoCache && (children.memoCache.index = 0);
          }
          ReactSharedInternals.H = HooksDispatcherOnRerender;
          children = Component(props, secondArg);
        } while (didScheduleRenderPhaseUpdateDuringThisPass);
        return children;
      }
      function TransitionAwareHostComponent() {
        var dispatcher = ReactSharedInternals.H, maybeThenable = dispatcher.useState()[0];
        maybeThenable = "function" === typeof maybeThenable.then ? useThenable(maybeThenable) : maybeThenable;
        dispatcher = dispatcher.useState()[0];
        (null !== currentHook ? currentHook.memoizedState : null) !== dispatcher && (currentlyRenderingFiber.flags |= 1024);
        return maybeThenable;
      }
      function checkDidRenderIdHook() {
        var didRenderIdHook = 0 !== localIdCounter;
        localIdCounter = 0;
        return didRenderIdHook;
      }
      function bailoutHooks(current, workInProgress2, lanes) {
        workInProgress2.updateQueue = current.updateQueue;
        workInProgress2.flags &= -2053;
        current.lanes &= ~lanes;
      }
      function resetHooksOnUnwind(workInProgress2) {
        if (didScheduleRenderPhaseUpdate) {
          for (workInProgress2 = workInProgress2.memoizedState; null !== workInProgress2; ) {
            var queue = workInProgress2.queue;
            null !== queue && (queue.pending = null);
            workInProgress2 = workInProgress2.next;
          }
          didScheduleRenderPhaseUpdate = false;
        }
        renderLanes = 0;
        workInProgressHook = currentHook = currentlyRenderingFiber = null;
        didScheduleRenderPhaseUpdateDuringThisPass = false;
        thenableIndexCounter = localIdCounter = 0;
        thenableState = null;
      }
      function mountWorkInProgressHook() {
        var hook = {
          memoizedState: null,
          baseState: null,
          baseQueue: null,
          queue: null,
          next: null
        };
        null === workInProgressHook ? currentlyRenderingFiber.memoizedState = workInProgressHook = hook : workInProgressHook = workInProgressHook.next = hook;
        return workInProgressHook;
      }
      function updateWorkInProgressHook() {
        if (null === currentHook) {
          var nextCurrentHook = currentlyRenderingFiber.alternate;
          nextCurrentHook = null !== nextCurrentHook ? nextCurrentHook.memoizedState : null;
        } else nextCurrentHook = currentHook.next;
        var nextWorkInProgressHook = null === workInProgressHook ? currentlyRenderingFiber.memoizedState : workInProgressHook.next;
        if (null !== nextWorkInProgressHook)
          workInProgressHook = nextWorkInProgressHook, currentHook = nextCurrentHook;
        else {
          if (null === nextCurrentHook) {
            if (null === currentlyRenderingFiber.alternate)
              throw Error(formatProdErrorMessage(467));
            throw Error(formatProdErrorMessage(310));
          }
          currentHook = nextCurrentHook;
          nextCurrentHook = {
            memoizedState: currentHook.memoizedState,
            baseState: currentHook.baseState,
            baseQueue: currentHook.baseQueue,
            queue: currentHook.queue,
            next: null
          };
          null === workInProgressHook ? currentlyRenderingFiber.memoizedState = workInProgressHook = nextCurrentHook : workInProgressHook = workInProgressHook.next = nextCurrentHook;
        }
        return workInProgressHook;
      }
      function createFunctionComponentUpdateQueue() {
        return { lastEffect: null, events: null, stores: null, memoCache: null };
      }
      function useThenable(thenable) {
        var index2 = thenableIndexCounter;
        thenableIndexCounter += 1;
        null === thenableState && (thenableState = []);
        thenable = trackUsedThenable(thenableState, thenable, index2);
        index2 = currentlyRenderingFiber;
        null === (null === workInProgressHook ? index2.memoizedState : workInProgressHook.next) && (index2 = index2.alternate, ReactSharedInternals.H = null === index2 || null === index2.memoizedState ? HooksDispatcherOnMount : HooksDispatcherOnUpdate);
        return thenable;
      }
      function use(usable) {
        if (null !== usable && "object" === typeof usable) {
          if ("function" === typeof usable.then) return useThenable(usable);
          if (usable.$$typeof === REACT_CONTEXT_TYPE) return readContext(usable);
        }
        throw Error(formatProdErrorMessage(438, String(usable)));
      }
      function useMemoCache(size) {
        var memoCache = null, updateQueue = currentlyRenderingFiber.updateQueue;
        null !== updateQueue && (memoCache = updateQueue.memoCache);
        if (null == memoCache) {
          var current = currentlyRenderingFiber.alternate;
          null !== current && (current = current.updateQueue, null !== current && (current = current.memoCache, null != current && (memoCache = {
            data: current.data.map(function(array) {
              return array.slice();
            }),
            index: 0
          })));
        }
        null == memoCache && (memoCache = { data: [], index: 0 });
        null === updateQueue && (updateQueue = createFunctionComponentUpdateQueue(), currentlyRenderingFiber.updateQueue = updateQueue);
        updateQueue.memoCache = memoCache;
        updateQueue = memoCache.data[memoCache.index];
        if (void 0 === updateQueue)
          for (updateQueue = memoCache.data[memoCache.index] = Array(size), current = 0; current < size; current++)
            updateQueue[current] = REACT_MEMO_CACHE_SENTINEL;
        memoCache.index++;
        return updateQueue;
      }
      function basicStateReducer(state, action) {
        return "function" === typeof action ? action(state) : action;
      }
      function updateReducer(reducer) {
        var hook = updateWorkInProgressHook();
        return updateReducerImpl(hook, currentHook, reducer);
      }
      function updateReducerImpl(hook, current, reducer) {
        var queue = hook.queue;
        if (null === queue) throw Error(formatProdErrorMessage(311));
        queue.lastRenderedReducer = reducer;
        var baseQueue = hook.baseQueue, pendingQueue = queue.pending;
        if (null !== pendingQueue) {
          if (null !== baseQueue) {
            var baseFirst = baseQueue.next;
            baseQueue.next = pendingQueue.next;
            pendingQueue.next = baseFirst;
          }
          current.baseQueue = baseQueue = pendingQueue;
          queue.pending = null;
        }
        pendingQueue = hook.baseState;
        if (null === baseQueue) hook.memoizedState = pendingQueue;
        else {
          current = baseQueue.next;
          var newBaseQueueFirst = baseFirst = null, newBaseQueueLast = null, update = current, didReadFromEntangledAsyncAction$60 = false;
          do {
            var updateLane = update.lane & -536870913;
            if (updateLane !== update.lane ? (workInProgressRootRenderLanes & updateLane) === updateLane : (renderLanes & updateLane) === updateLane) {
              var revertLane = update.revertLane;
              if (0 === revertLane)
                null !== newBaseQueueLast && (newBaseQueueLast = newBaseQueueLast.next = {
                  lane: 0,
                  revertLane: 0,
                  gesture: null,
                  action: update.action,
                  hasEagerState: update.hasEagerState,
                  eagerState: update.eagerState,
                  next: null
                }), updateLane === currentEntangledLane && (didReadFromEntangledAsyncAction$60 = true);
              else if ((renderLanes & revertLane) === revertLane) {
                update = update.next;
                revertLane === currentEntangledLane && (didReadFromEntangledAsyncAction$60 = true);
                continue;
              } else
                updateLane = {
                  lane: 0,
                  revertLane: update.revertLane,
                  gesture: null,
                  action: update.action,
                  hasEagerState: update.hasEagerState,
                  eagerState: update.eagerState,
                  next: null
                }, null === newBaseQueueLast ? (newBaseQueueFirst = newBaseQueueLast = updateLane, baseFirst = pendingQueue) : newBaseQueueLast = newBaseQueueLast.next = updateLane, currentlyRenderingFiber.lanes |= revertLane, workInProgressRootSkippedLanes |= revertLane;
              updateLane = update.action;
              shouldDoubleInvokeUserFnsInHooksDEV && reducer(pendingQueue, updateLane);
              pendingQueue = update.hasEagerState ? update.eagerState : reducer(pendingQueue, updateLane);
            } else
              revertLane = {
                lane: updateLane,
                revertLane: update.revertLane,
                gesture: update.gesture,
                action: update.action,
                hasEagerState: update.hasEagerState,
                eagerState: update.eagerState,
                next: null
              }, null === newBaseQueueLast ? (newBaseQueueFirst = newBaseQueueLast = revertLane, baseFirst = pendingQueue) : newBaseQueueLast = newBaseQueueLast.next = revertLane, currentlyRenderingFiber.lanes |= updateLane, workInProgressRootSkippedLanes |= updateLane;
            update = update.next;
          } while (null !== update && update !== current);
          null === newBaseQueueLast ? baseFirst = pendingQueue : newBaseQueueLast.next = newBaseQueueFirst;
          if (!objectIs(pendingQueue, hook.memoizedState) && (didReceiveUpdate = true, didReadFromEntangledAsyncAction$60 && (reducer = currentEntangledActionThenable, null !== reducer)))
            throw reducer;
          hook.memoizedState = pendingQueue;
          hook.baseState = baseFirst;
          hook.baseQueue = newBaseQueueLast;
          queue.lastRenderedState = pendingQueue;
        }
        null === baseQueue && (queue.lanes = 0);
        return [hook.memoizedState, queue.dispatch];
      }
      function rerenderReducer(reducer) {
        var hook = updateWorkInProgressHook(), queue = hook.queue;
        if (null === queue) throw Error(formatProdErrorMessage(311));
        queue.lastRenderedReducer = reducer;
        var dispatch = queue.dispatch, lastRenderPhaseUpdate = queue.pending, newState = hook.memoizedState;
        if (null !== lastRenderPhaseUpdate) {
          queue.pending = null;
          var update = lastRenderPhaseUpdate = lastRenderPhaseUpdate.next;
          do
            newState = reducer(newState, update.action), update = update.next;
          while (update !== lastRenderPhaseUpdate);
          objectIs(newState, hook.memoizedState) || (didReceiveUpdate = true);
          hook.memoizedState = newState;
          null === hook.baseQueue && (hook.baseState = newState);
          queue.lastRenderedState = newState;
        }
        return [newState, dispatch];
      }
      function updateSyncExternalStore(subscribe, getSnapshot, getServerSnapshot) {
        var fiber = currentlyRenderingFiber, hook = updateWorkInProgressHook(), isHydrating$jscomp$0 = isHydrating;
        if (isHydrating$jscomp$0) {
          if (void 0 === getServerSnapshot) throw Error(formatProdErrorMessage(407));
          getServerSnapshot = getServerSnapshot();
        } else getServerSnapshot = getSnapshot();
        var snapshotChanged = !objectIs(
          (currentHook || hook).memoizedState,
          getServerSnapshot
        );
        snapshotChanged && (hook.memoizedState = getServerSnapshot, didReceiveUpdate = true);
        hook = hook.queue;
        updateEffect(subscribeToStore.bind(null, fiber, hook, subscribe), [
          subscribe
        ]);
        if (hook.getSnapshot !== getSnapshot || snapshotChanged || null !== workInProgressHook && workInProgressHook.memoizedState.tag & 1) {
          fiber.flags |= 2048;
          pushSimpleEffect(
            9,
            { destroy: void 0 },
            updateStoreInstance.bind(
              null,
              fiber,
              hook,
              getServerSnapshot,
              getSnapshot
            ),
            null
          );
          if (null === workInProgressRoot) throw Error(formatProdErrorMessage(349));
          isHydrating$jscomp$0 || 0 !== (renderLanes & 127) || pushStoreConsistencyCheck(fiber, getSnapshot, getServerSnapshot);
        }
        return getServerSnapshot;
      }
      function pushStoreConsistencyCheck(fiber, getSnapshot, renderedSnapshot) {
        fiber.flags |= 16384;
        fiber = { getSnapshot, value: renderedSnapshot };
        getSnapshot = currentlyRenderingFiber.updateQueue;
        null === getSnapshot ? (getSnapshot = createFunctionComponentUpdateQueue(), currentlyRenderingFiber.updateQueue = getSnapshot, getSnapshot.stores = [fiber]) : (renderedSnapshot = getSnapshot.stores, null === renderedSnapshot ? getSnapshot.stores = [fiber] : renderedSnapshot.push(fiber));
      }
      function updateStoreInstance(fiber, inst, nextSnapshot, getSnapshot) {
        inst.value = nextSnapshot;
        inst.getSnapshot = getSnapshot;
        checkIfSnapshotChanged(inst) && forceStoreRerender(fiber);
      }
      function subscribeToStore(fiber, inst, subscribe) {
        return subscribe(function() {
          checkIfSnapshotChanged(inst) && forceStoreRerender(fiber);
        });
      }
      function checkIfSnapshotChanged(inst) {
        var latestGetSnapshot = inst.getSnapshot;
        inst = inst.value;
        try {
          var nextValue = latestGetSnapshot();
          return !objectIs(inst, nextValue);
        } catch (error) {
          return true;
        }
      }
      function forceStoreRerender(fiber) {
        var root2 = enqueueConcurrentRenderForLane(fiber, 2);
        null !== root2 && scheduleUpdateOnFiber(root2, fiber, 2);
      }
      function mountStateImpl(initialState) {
        var hook = mountWorkInProgressHook();
        if ("function" === typeof initialState) {
          var initialStateInitializer = initialState;
          initialState = initialStateInitializer();
          if (shouldDoubleInvokeUserFnsInHooksDEV) {
            setIsStrictModeForDevtools(true);
            try {
              initialStateInitializer();
            } finally {
              setIsStrictModeForDevtools(false);
            }
          }
        }
        hook.memoizedState = hook.baseState = initialState;
        hook.queue = {
          pending: null,
          lanes: 0,
          dispatch: null,
          lastRenderedReducer: basicStateReducer,
          lastRenderedState: initialState
        };
        return hook;
      }
      function updateOptimisticImpl(hook, current, passthrough, reducer) {
        hook.baseState = passthrough;
        return updateReducerImpl(
          hook,
          currentHook,
          "function" === typeof reducer ? reducer : basicStateReducer
        );
      }
      function dispatchActionState(fiber, actionQueue, setPendingState, setState, payload) {
        if (isRenderPhaseUpdate(fiber)) throw Error(formatProdErrorMessage(485));
        fiber = actionQueue.action;
        if (null !== fiber) {
          var actionNode = {
            payload,
            action: fiber,
            next: null,
            isTransition: true,
            status: "pending",
            value: null,
            reason: null,
            listeners: [],
            then: function(listener) {
              actionNode.listeners.push(listener);
            }
          };
          null !== ReactSharedInternals.T ? setPendingState(true) : actionNode.isTransition = false;
          setState(actionNode);
          setPendingState = actionQueue.pending;
          null === setPendingState ? (actionNode.next = actionQueue.pending = actionNode, runActionStateAction(actionQueue, actionNode)) : (actionNode.next = setPendingState.next, actionQueue.pending = setPendingState.next = actionNode);
        }
      }
      function runActionStateAction(actionQueue, node) {
        var action = node.action, payload = node.payload, prevState = actionQueue.state;
        if (node.isTransition) {
          var prevTransition = ReactSharedInternals.T, currentTransition = {};
          ReactSharedInternals.T = currentTransition;
          try {
            var returnValue = action(prevState, payload), onStartTransitionFinish = ReactSharedInternals.S;
            null !== onStartTransitionFinish && onStartTransitionFinish(currentTransition, returnValue);
            handleActionReturnValue(actionQueue, node, returnValue);
          } catch (error) {
            onActionError(actionQueue, node, error);
          } finally {
            null !== prevTransition && null !== currentTransition.types && (prevTransition.types = currentTransition.types), ReactSharedInternals.T = prevTransition;
          }
        } else
          try {
            prevTransition = action(prevState, payload), handleActionReturnValue(actionQueue, node, prevTransition);
          } catch (error$66) {
            onActionError(actionQueue, node, error$66);
          }
      }
      function handleActionReturnValue(actionQueue, node, returnValue) {
        null !== returnValue && "object" === typeof returnValue && "function" === typeof returnValue.then ? returnValue.then(
          function(nextState) {
            onActionSuccess(actionQueue, node, nextState);
          },
          function(error) {
            return onActionError(actionQueue, node, error);
          }
        ) : onActionSuccess(actionQueue, node, returnValue);
      }
      function onActionSuccess(actionQueue, actionNode, nextState) {
        actionNode.status = "fulfilled";
        actionNode.value = nextState;
        notifyActionListeners(actionNode);
        actionQueue.state = nextState;
        actionNode = actionQueue.pending;
        null !== actionNode && (nextState = actionNode.next, nextState === actionNode ? actionQueue.pending = null : (nextState = nextState.next, actionNode.next = nextState, runActionStateAction(actionQueue, nextState)));
      }
      function onActionError(actionQueue, actionNode, error) {
        var last = actionQueue.pending;
        actionQueue.pending = null;
        if (null !== last) {
          last = last.next;
          do
            actionNode.status = "rejected", actionNode.reason = error, notifyActionListeners(actionNode), actionNode = actionNode.next;
          while (actionNode !== last);
        }
        actionQueue.action = null;
      }
      function notifyActionListeners(actionNode) {
        actionNode = actionNode.listeners;
        for (var i = 0; i < actionNode.length; i++) (0, actionNode[i])();
      }
      function actionStateReducer(oldState, newState) {
        return newState;
      }
      function mountActionState(action, initialStateProp) {
        if (isHydrating) {
          var ssrFormState = workInProgressRoot.formState;
          if (null !== ssrFormState) {
            a: {
              var JSCompiler_inline_result = currentlyRenderingFiber;
              if (isHydrating) {
                if (nextHydratableInstance) {
                  b: {
                    var JSCompiler_inline_result$jscomp$0 = nextHydratableInstance;
                    for (var inRootOrSingleton = rootOrSingletonContext; 8 !== JSCompiler_inline_result$jscomp$0.nodeType; ) {
                      if (!inRootOrSingleton) {
                        JSCompiler_inline_result$jscomp$0 = null;
                        break b;
                      }
                      JSCompiler_inline_result$jscomp$0 = getNextHydratable(
                        JSCompiler_inline_result$jscomp$0.nextSibling
                      );
                      if (null === JSCompiler_inline_result$jscomp$0) {
                        JSCompiler_inline_result$jscomp$0 = null;
                        break b;
                      }
                    }
                    inRootOrSingleton = JSCompiler_inline_result$jscomp$0.data;
                    JSCompiler_inline_result$jscomp$0 = "F!" === inRootOrSingleton || "F" === inRootOrSingleton ? JSCompiler_inline_result$jscomp$0 : null;
                  }
                  if (JSCompiler_inline_result$jscomp$0) {
                    nextHydratableInstance = getNextHydratable(
                      JSCompiler_inline_result$jscomp$0.nextSibling
                    );
                    JSCompiler_inline_result = "F!" === JSCompiler_inline_result$jscomp$0.data;
                    break a;
                  }
                }
                throwOnHydrationMismatch(JSCompiler_inline_result);
              }
              JSCompiler_inline_result = false;
            }
            JSCompiler_inline_result && (initialStateProp = ssrFormState[0]);
          }
        }
        ssrFormState = mountWorkInProgressHook();
        ssrFormState.memoizedState = ssrFormState.baseState = initialStateProp;
        JSCompiler_inline_result = {
          pending: null,
          lanes: 0,
          dispatch: null,
          lastRenderedReducer: actionStateReducer,
          lastRenderedState: initialStateProp
        };
        ssrFormState.queue = JSCompiler_inline_result;
        ssrFormState = dispatchSetState.bind(
          null,
          currentlyRenderingFiber,
          JSCompiler_inline_result
        );
        JSCompiler_inline_result.dispatch = ssrFormState;
        JSCompiler_inline_result = mountStateImpl(false);
        inRootOrSingleton = dispatchOptimisticSetState.bind(
          null,
          currentlyRenderingFiber,
          false,
          JSCompiler_inline_result.queue
        );
        JSCompiler_inline_result = mountWorkInProgressHook();
        JSCompiler_inline_result$jscomp$0 = {
          state: initialStateProp,
          dispatch: null,
          action,
          pending: null
        };
        JSCompiler_inline_result.queue = JSCompiler_inline_result$jscomp$0;
        ssrFormState = dispatchActionState.bind(
          null,
          currentlyRenderingFiber,
          JSCompiler_inline_result$jscomp$0,
          inRootOrSingleton,
          ssrFormState
        );
        JSCompiler_inline_result$jscomp$0.dispatch = ssrFormState;
        JSCompiler_inline_result.memoizedState = action;
        return [initialStateProp, ssrFormState, false];
      }
      function updateActionState(action) {
        var stateHook = updateWorkInProgressHook();
        return updateActionStateImpl(stateHook, currentHook, action);
      }
      function updateActionStateImpl(stateHook, currentStateHook, action) {
        currentStateHook = updateReducerImpl(
          stateHook,
          currentStateHook,
          actionStateReducer
        )[0];
        stateHook = updateReducer(basicStateReducer)[0];
        if ("object" === typeof currentStateHook && null !== currentStateHook && "function" === typeof currentStateHook.then)
          try {
            var state = useThenable(currentStateHook);
          } catch (x) {
            if (x === SuspenseException) throw SuspenseActionException;
            throw x;
          }
        else state = currentStateHook;
        currentStateHook = updateWorkInProgressHook();
        var actionQueue = currentStateHook.queue, dispatch = actionQueue.dispatch;
        action !== currentStateHook.memoizedState && (currentlyRenderingFiber.flags |= 2048, pushSimpleEffect(
          9,
          { destroy: void 0 },
          actionStateActionEffect.bind(null, actionQueue, action),
          null
        ));
        return [state, dispatch, stateHook];
      }
      function actionStateActionEffect(actionQueue, action) {
        actionQueue.action = action;
      }
      function rerenderActionState(action) {
        var stateHook = updateWorkInProgressHook(), currentStateHook = currentHook;
        if (null !== currentStateHook)
          return updateActionStateImpl(stateHook, currentStateHook, action);
        updateWorkInProgressHook();
        stateHook = stateHook.memoizedState;
        currentStateHook = updateWorkInProgressHook();
        var dispatch = currentStateHook.queue.dispatch;
        currentStateHook.memoizedState = action;
        return [stateHook, dispatch, false];
      }
      function pushSimpleEffect(tag, inst, create, deps) {
        tag = { tag, create, deps, inst, next: null };
        inst = currentlyRenderingFiber.updateQueue;
        null === inst && (inst = createFunctionComponentUpdateQueue(), currentlyRenderingFiber.updateQueue = inst);
        create = inst.lastEffect;
        null === create ? inst.lastEffect = tag.next = tag : (deps = create.next, create.next = tag, tag.next = deps, inst.lastEffect = tag);
        return tag;
      }
      function updateRef() {
        return updateWorkInProgressHook().memoizedState;
      }
      function mountEffectImpl(fiberFlags, hookFlags, create, deps) {
        var hook = mountWorkInProgressHook();
        currentlyRenderingFiber.flags |= fiberFlags;
        hook.memoizedState = pushSimpleEffect(
          1 | hookFlags,
          { destroy: void 0 },
          create,
          void 0 === deps ? null : deps
        );
      }
      function updateEffectImpl(fiberFlags, hookFlags, create, deps) {
        var hook = updateWorkInProgressHook();
        deps = void 0 === deps ? null : deps;
        var inst = hook.memoizedState.inst;
        null !== currentHook && null !== deps && areHookInputsEqual(deps, currentHook.memoizedState.deps) ? hook.memoizedState = pushSimpleEffect(hookFlags, inst, create, deps) : (currentlyRenderingFiber.flags |= fiberFlags, hook.memoizedState = pushSimpleEffect(
          1 | hookFlags,
          inst,
          create,
          deps
        ));
      }
      function mountEffect(create, deps) {
        mountEffectImpl(8390656, 8, create, deps);
      }
      function updateEffect(create, deps) {
        updateEffectImpl(2048, 8, create, deps);
      }
      function useEffectEventImpl(payload) {
        currentlyRenderingFiber.flags |= 4;
        var componentUpdateQueue = currentlyRenderingFiber.updateQueue;
        if (null === componentUpdateQueue)
          componentUpdateQueue = createFunctionComponentUpdateQueue(), currentlyRenderingFiber.updateQueue = componentUpdateQueue, componentUpdateQueue.events = [payload];
        else {
          var events = componentUpdateQueue.events;
          null === events ? componentUpdateQueue.events = [payload] : events.push(payload);
        }
      }
      function updateEvent(callback) {
        var ref = updateWorkInProgressHook().memoizedState;
        useEffectEventImpl({ ref, nextImpl: callback });
        return function() {
          if (0 !== (executionContext & 2)) throw Error(formatProdErrorMessage(440));
          return ref.impl.apply(void 0, arguments);
        };
      }
      function updateInsertionEffect(create, deps) {
        return updateEffectImpl(4, 2, create, deps);
      }
      function updateLayoutEffect(create, deps) {
        return updateEffectImpl(4, 4, create, deps);
      }
      function imperativeHandleEffect(create, ref) {
        if ("function" === typeof ref) {
          create = create();
          var refCleanup = ref(create);
          return function() {
            "function" === typeof refCleanup ? refCleanup() : ref(null);
          };
        }
        if (null !== ref && void 0 !== ref)
          return create = create(), ref.current = create, function() {
            ref.current = null;
          };
      }
      function updateImperativeHandle(ref, create, deps) {
        deps = null !== deps && void 0 !== deps ? deps.concat([ref]) : null;
        updateEffectImpl(4, 4, imperativeHandleEffect.bind(null, create, ref), deps);
      }
      function mountDebugValue() {
      }
      function updateCallback(callback, deps) {
        var hook = updateWorkInProgressHook();
        deps = void 0 === deps ? null : deps;
        var prevState = hook.memoizedState;
        if (null !== deps && areHookInputsEqual(deps, prevState[1]))
          return prevState[0];
        hook.memoizedState = [callback, deps];
        return callback;
      }
      function updateMemo(nextCreate, deps) {
        var hook = updateWorkInProgressHook();
        deps = void 0 === deps ? null : deps;
        var prevState = hook.memoizedState;
        if (null !== deps && areHookInputsEqual(deps, prevState[1]))
          return prevState[0];
        prevState = nextCreate();
        if (shouldDoubleInvokeUserFnsInHooksDEV) {
          setIsStrictModeForDevtools(true);
          try {
            nextCreate();
          } finally {
            setIsStrictModeForDevtools(false);
          }
        }
        hook.memoizedState = [prevState, deps];
        return prevState;
      }
      function mountDeferredValueImpl(hook, value, initialValue) {
        if (void 0 === initialValue || 0 !== (renderLanes & 1073741824) && 0 === (workInProgressRootRenderLanes & 261930))
          return hook.memoizedState = value;
        hook.memoizedState = initialValue;
        hook = requestDeferredLane();
        currentlyRenderingFiber.lanes |= hook;
        workInProgressRootSkippedLanes |= hook;
        return initialValue;
      }
      function updateDeferredValueImpl(hook, prevValue, value, initialValue) {
        if (objectIs(value, prevValue)) return value;
        if (null !== currentTreeHiddenStackCursor.current)
          return hook = mountDeferredValueImpl(hook, value, initialValue), objectIs(hook, prevValue) || (didReceiveUpdate = true), hook;
        if (0 === (renderLanes & 42) || 0 !== (renderLanes & 1073741824) && 0 === (workInProgressRootRenderLanes & 261930))
          return didReceiveUpdate = true, hook.memoizedState = value;
        hook = requestDeferredLane();
        currentlyRenderingFiber.lanes |= hook;
        workInProgressRootSkippedLanes |= hook;
        return prevValue;
      }
      function startTransition(fiber, queue, pendingState, finishedState, callback) {
        var previousPriority = ReactDOMSharedInternals.p;
        ReactDOMSharedInternals.p = 0 !== previousPriority && 8 > previousPriority ? previousPriority : 8;
        var prevTransition = ReactSharedInternals.T, currentTransition = {};
        ReactSharedInternals.T = currentTransition;
        dispatchOptimisticSetState(fiber, false, queue, pendingState);
        try {
          var returnValue = callback(), onStartTransitionFinish = ReactSharedInternals.S;
          null !== onStartTransitionFinish && onStartTransitionFinish(currentTransition, returnValue);
          if (null !== returnValue && "object" === typeof returnValue && "function" === typeof returnValue.then) {
            var thenableForFinishedState = chainThenableValue(
              returnValue,
              finishedState
            );
            dispatchSetStateInternal(
              fiber,
              queue,
              thenableForFinishedState,
              requestUpdateLane(fiber)
            );
          } else
            dispatchSetStateInternal(
              fiber,
              queue,
              finishedState,
              requestUpdateLane(fiber)
            );
        } catch (error) {
          dispatchSetStateInternal(
            fiber,
            queue,
            { then: function() {
            }, status: "rejected", reason: error },
            requestUpdateLane()
          );
        } finally {
          ReactDOMSharedInternals.p = previousPriority, null !== prevTransition && null !== currentTransition.types && (prevTransition.types = currentTransition.types), ReactSharedInternals.T = prevTransition;
        }
      }
      function noop() {
      }
      function startHostTransition(formFiber, pendingState, action, formData) {
        if (5 !== formFiber.tag) throw Error(formatProdErrorMessage(476));
        var queue = ensureFormComponentIsStateful(formFiber).queue;
        startTransition(
          formFiber,
          queue,
          pendingState,
          sharedNotPendingObject,
          null === action ? noop : function() {
            requestFormReset$1(formFiber);
            return action(formData);
          }
        );
      }
      function ensureFormComponentIsStateful(formFiber) {
        var existingStateHook = formFiber.memoizedState;
        if (null !== existingStateHook) return existingStateHook;
        existingStateHook = {
          memoizedState: sharedNotPendingObject,
          baseState: sharedNotPendingObject,
          baseQueue: null,
          queue: {
            pending: null,
            lanes: 0,
            dispatch: null,
            lastRenderedReducer: basicStateReducer,
            lastRenderedState: sharedNotPendingObject
          },
          next: null
        };
        var initialResetState = {};
        existingStateHook.next = {
          memoizedState: initialResetState,
          baseState: initialResetState,
          baseQueue: null,
          queue: {
            pending: null,
            lanes: 0,
            dispatch: null,
            lastRenderedReducer: basicStateReducer,
            lastRenderedState: initialResetState
          },
          next: null
        };
        formFiber.memoizedState = existingStateHook;
        formFiber = formFiber.alternate;
        null !== formFiber && (formFiber.memoizedState = existingStateHook);
        return existingStateHook;
      }
      function requestFormReset$1(formFiber) {
        var stateHook = ensureFormComponentIsStateful(formFiber);
        null === stateHook.next && (stateHook = formFiber.alternate.memoizedState);
        dispatchSetStateInternal(
          formFiber,
          stateHook.next.queue,
          {},
          requestUpdateLane()
        );
      }
      function useHostTransitionStatus() {
        return readContext(HostTransitionContext);
      }
      function updateId() {
        return updateWorkInProgressHook().memoizedState;
      }
      function updateRefresh() {
        return updateWorkInProgressHook().memoizedState;
      }
      function refreshCache(fiber) {
        for (var provider = fiber.return; null !== provider; ) {
          switch (provider.tag) {
            case 24:
            case 3:
              var lane = requestUpdateLane();
              fiber = createUpdate(lane);
              var root$69 = enqueueUpdate(provider, fiber, lane);
              null !== root$69 && (scheduleUpdateOnFiber(root$69, provider, lane), entangleTransitions(root$69, provider, lane));
              provider = { cache: createCache() };
              fiber.payload = provider;
              return;
          }
          provider = provider.return;
        }
      }
      function dispatchReducerAction(fiber, queue, action) {
        var lane = requestUpdateLane();
        action = {
          lane,
          revertLane: 0,
          gesture: null,
          action,
          hasEagerState: false,
          eagerState: null,
          next: null
        };
        isRenderPhaseUpdate(fiber) ? enqueueRenderPhaseUpdate(queue, action) : (action = enqueueConcurrentHookUpdate(fiber, queue, action, lane), null !== action && (scheduleUpdateOnFiber(action, fiber, lane), entangleTransitionUpdate(action, queue, lane)));
      }
      function dispatchSetState(fiber, queue, action) {
        var lane = requestUpdateLane();
        dispatchSetStateInternal(fiber, queue, action, lane);
      }
      function dispatchSetStateInternal(fiber, queue, action, lane) {
        var update = {
          lane,
          revertLane: 0,
          gesture: null,
          action,
          hasEagerState: false,
          eagerState: null,
          next: null
        };
        if (isRenderPhaseUpdate(fiber)) enqueueRenderPhaseUpdate(queue, update);
        else {
          var alternate = fiber.alternate;
          if (0 === fiber.lanes && (null === alternate || 0 === alternate.lanes) && (alternate = queue.lastRenderedReducer, null !== alternate))
            try {
              var currentState = queue.lastRenderedState, eagerState = alternate(currentState, action);
              update.hasEagerState = true;
              update.eagerState = eagerState;
              if (objectIs(eagerState, currentState))
                return enqueueUpdate$1(fiber, queue, update, 0), null === workInProgressRoot && finishQueueingConcurrentUpdates(), false;
            } catch (error) {
            } finally {
            }
          action = enqueueConcurrentHookUpdate(fiber, queue, update, lane);
          if (null !== action)
            return scheduleUpdateOnFiber(action, fiber, lane), entangleTransitionUpdate(action, queue, lane), true;
        }
        return false;
      }
      function dispatchOptimisticSetState(fiber, throwIfDuringRender, queue, action) {
        action = {
          lane: 2,
          revertLane: requestTransitionLane(),
          gesture: null,
          action,
          hasEagerState: false,
          eagerState: null,
          next: null
        };
        if (isRenderPhaseUpdate(fiber)) {
          if (throwIfDuringRender) throw Error(formatProdErrorMessage(479));
        } else
          throwIfDuringRender = enqueueConcurrentHookUpdate(
            fiber,
            queue,
            action,
            2
          ), null !== throwIfDuringRender && scheduleUpdateOnFiber(throwIfDuringRender, fiber, 2);
      }
      function isRenderPhaseUpdate(fiber) {
        var alternate = fiber.alternate;
        return fiber === currentlyRenderingFiber || null !== alternate && alternate === currentlyRenderingFiber;
      }
      function enqueueRenderPhaseUpdate(queue, update) {
        didScheduleRenderPhaseUpdateDuringThisPass = didScheduleRenderPhaseUpdate = true;
        var pending = queue.pending;
        null === pending ? update.next = update : (update.next = pending.next, pending.next = update);
        queue.pending = update;
      }
      function entangleTransitionUpdate(root2, queue, lane) {
        if (0 !== (lane & 4194048)) {
          var queueLanes = queue.lanes;
          queueLanes &= root2.pendingLanes;
          lane |= queueLanes;
          queue.lanes = lane;
          markRootEntangled(root2, lane);
        }
      }
      var ContextOnlyDispatcher = {
        readContext,
        use,
        useCallback: throwInvalidHookError,
        useContext: throwInvalidHookError,
        useEffect: throwInvalidHookError,
        useImperativeHandle: throwInvalidHookError,
        useLayoutEffect: throwInvalidHookError,
        useInsertionEffect: throwInvalidHookError,
        useMemo: throwInvalidHookError,
        useReducer: throwInvalidHookError,
        useRef: throwInvalidHookError,
        useState: throwInvalidHookError,
        useDebugValue: throwInvalidHookError,
        useDeferredValue: throwInvalidHookError,
        useTransition: throwInvalidHookError,
        useSyncExternalStore: throwInvalidHookError,
        useId: throwInvalidHookError,
        useHostTransitionStatus: throwInvalidHookError,
        useFormState: throwInvalidHookError,
        useActionState: throwInvalidHookError,
        useOptimistic: throwInvalidHookError,
        useMemoCache: throwInvalidHookError,
        useCacheRefresh: throwInvalidHookError
      };
      ContextOnlyDispatcher.useEffectEvent = throwInvalidHookError;
      var HooksDispatcherOnMount = {
        readContext,
        use,
        useCallback: function(callback, deps) {
          mountWorkInProgressHook().memoizedState = [
            callback,
            void 0 === deps ? null : deps
          ];
          return callback;
        },
        useContext: readContext,
        useEffect: mountEffect,
        useImperativeHandle: function(ref, create, deps) {
          deps = null !== deps && void 0 !== deps ? deps.concat([ref]) : null;
          mountEffectImpl(
            4194308,
            4,
            imperativeHandleEffect.bind(null, create, ref),
            deps
          );
        },
        useLayoutEffect: function(create, deps) {
          return mountEffectImpl(4194308, 4, create, deps);
        },
        useInsertionEffect: function(create, deps) {
          mountEffectImpl(4, 2, create, deps);
        },
        useMemo: function(nextCreate, deps) {
          var hook = mountWorkInProgressHook();
          deps = void 0 === deps ? null : deps;
          var nextValue = nextCreate();
          if (shouldDoubleInvokeUserFnsInHooksDEV) {
            setIsStrictModeForDevtools(true);
            try {
              nextCreate();
            } finally {
              setIsStrictModeForDevtools(false);
            }
          }
          hook.memoizedState = [nextValue, deps];
          return nextValue;
        },
        useReducer: function(reducer, initialArg, init) {
          var hook = mountWorkInProgressHook();
          if (void 0 !== init) {
            var initialState = init(initialArg);
            if (shouldDoubleInvokeUserFnsInHooksDEV) {
              setIsStrictModeForDevtools(true);
              try {
                init(initialArg);
              } finally {
                setIsStrictModeForDevtools(false);
              }
            }
          } else initialState = initialArg;
          hook.memoizedState = hook.baseState = initialState;
          reducer = {
            pending: null,
            lanes: 0,
            dispatch: null,
            lastRenderedReducer: reducer,
            lastRenderedState: initialState
          };
          hook.queue = reducer;
          reducer = reducer.dispatch = dispatchReducerAction.bind(
            null,
            currentlyRenderingFiber,
            reducer
          );
          return [hook.memoizedState, reducer];
        },
        useRef: function(initialValue) {
          var hook = mountWorkInProgressHook();
          initialValue = { current: initialValue };
          return hook.memoizedState = initialValue;
        },
        useState: function(initialState) {
          initialState = mountStateImpl(initialState);
          var queue = initialState.queue, dispatch = dispatchSetState.bind(null, currentlyRenderingFiber, queue);
          queue.dispatch = dispatch;
          return [initialState.memoizedState, dispatch];
        },
        useDebugValue: mountDebugValue,
        useDeferredValue: function(value, initialValue) {
          var hook = mountWorkInProgressHook();
          return mountDeferredValueImpl(hook, value, initialValue);
        },
        useTransition: function() {
          var stateHook = mountStateImpl(false);
          stateHook = startTransition.bind(
            null,
            currentlyRenderingFiber,
            stateHook.queue,
            true,
            false
          );
          mountWorkInProgressHook().memoizedState = stateHook;
          return [false, stateHook];
        },
        useSyncExternalStore: function(subscribe, getSnapshot, getServerSnapshot) {
          var fiber = currentlyRenderingFiber, hook = mountWorkInProgressHook();
          if (isHydrating) {
            if (void 0 === getServerSnapshot)
              throw Error(formatProdErrorMessage(407));
            getServerSnapshot = getServerSnapshot();
          } else {
            getServerSnapshot = getSnapshot();
            if (null === workInProgressRoot)
              throw Error(formatProdErrorMessage(349));
            0 !== (workInProgressRootRenderLanes & 127) || pushStoreConsistencyCheck(fiber, getSnapshot, getServerSnapshot);
          }
          hook.memoizedState = getServerSnapshot;
          var inst = { value: getServerSnapshot, getSnapshot };
          hook.queue = inst;
          mountEffect(subscribeToStore.bind(null, fiber, inst, subscribe), [
            subscribe
          ]);
          fiber.flags |= 2048;
          pushSimpleEffect(
            9,
            { destroy: void 0 },
            updateStoreInstance.bind(
              null,
              fiber,
              inst,
              getServerSnapshot,
              getSnapshot
            ),
            null
          );
          return getServerSnapshot;
        },
        useId: function() {
          var hook = mountWorkInProgressHook(), identifierPrefix = workInProgressRoot.identifierPrefix;
          if (isHydrating) {
            var JSCompiler_inline_result = treeContextOverflow;
            var idWithLeadingBit = treeContextId;
            JSCompiler_inline_result = (idWithLeadingBit & ~(1 << 32 - clz32(idWithLeadingBit) - 1)).toString(32) + JSCompiler_inline_result;
            identifierPrefix = "_" + identifierPrefix + "R_" + JSCompiler_inline_result;
            JSCompiler_inline_result = localIdCounter++;
            0 < JSCompiler_inline_result && (identifierPrefix += "H" + JSCompiler_inline_result.toString(32));
            identifierPrefix += "_";
          } else
            JSCompiler_inline_result = globalClientIdCounter++, identifierPrefix = "_" + identifierPrefix + "r_" + JSCompiler_inline_result.toString(32) + "_";
          return hook.memoizedState = identifierPrefix;
        },
        useHostTransitionStatus,
        useFormState: mountActionState,
        useActionState: mountActionState,
        useOptimistic: function(passthrough) {
          var hook = mountWorkInProgressHook();
          hook.memoizedState = hook.baseState = passthrough;
          var queue = {
            pending: null,
            lanes: 0,
            dispatch: null,
            lastRenderedReducer: null,
            lastRenderedState: null
          };
          hook.queue = queue;
          hook = dispatchOptimisticSetState.bind(
            null,
            currentlyRenderingFiber,
            true,
            queue
          );
          queue.dispatch = hook;
          return [passthrough, hook];
        },
        useMemoCache,
        useCacheRefresh: function() {
          return mountWorkInProgressHook().memoizedState = refreshCache.bind(
            null,
            currentlyRenderingFiber
          );
        },
        useEffectEvent: function(callback) {
          var hook = mountWorkInProgressHook(), ref = { impl: callback };
          hook.memoizedState = ref;
          return function() {
            if (0 !== (executionContext & 2))
              throw Error(formatProdErrorMessage(440));
            return ref.impl.apply(void 0, arguments);
          };
        }
      };
      var HooksDispatcherOnUpdate = {
        readContext,
        use,
        useCallback: updateCallback,
        useContext: readContext,
        useEffect: updateEffect,
        useImperativeHandle: updateImperativeHandle,
        useInsertionEffect: updateInsertionEffect,
        useLayoutEffect: updateLayoutEffect,
        useMemo: updateMemo,
        useReducer: updateReducer,
        useRef: updateRef,
        useState: function() {
          return updateReducer(basicStateReducer);
        },
        useDebugValue: mountDebugValue,
        useDeferredValue: function(value, initialValue) {
          var hook = updateWorkInProgressHook();
          return updateDeferredValueImpl(
            hook,
            currentHook.memoizedState,
            value,
            initialValue
          );
        },
        useTransition: function() {
          var booleanOrThenable = updateReducer(basicStateReducer)[0], start = updateWorkInProgressHook().memoizedState;
          return [
            "boolean" === typeof booleanOrThenable ? booleanOrThenable : useThenable(booleanOrThenable),
            start
          ];
        },
        useSyncExternalStore: updateSyncExternalStore,
        useId: updateId,
        useHostTransitionStatus,
        useFormState: updateActionState,
        useActionState: updateActionState,
        useOptimistic: function(passthrough, reducer) {
          var hook = updateWorkInProgressHook();
          return updateOptimisticImpl(hook, currentHook, passthrough, reducer);
        },
        useMemoCache,
        useCacheRefresh: updateRefresh
      };
      HooksDispatcherOnUpdate.useEffectEvent = updateEvent;
      var HooksDispatcherOnRerender = {
        readContext,
        use,
        useCallback: updateCallback,
        useContext: readContext,
        useEffect: updateEffect,
        useImperativeHandle: updateImperativeHandle,
        useInsertionEffect: updateInsertionEffect,
        useLayoutEffect: updateLayoutEffect,
        useMemo: updateMemo,
        useReducer: rerenderReducer,
        useRef: updateRef,
        useState: function() {
          return rerenderReducer(basicStateReducer);
        },
        useDebugValue: mountDebugValue,
        useDeferredValue: function(value, initialValue) {
          var hook = updateWorkInProgressHook();
          return null === currentHook ? mountDeferredValueImpl(hook, value, initialValue) : updateDeferredValueImpl(
            hook,
            currentHook.memoizedState,
            value,
            initialValue
          );
        },
        useTransition: function() {
          var booleanOrThenable = rerenderReducer(basicStateReducer)[0], start = updateWorkInProgressHook().memoizedState;
          return [
            "boolean" === typeof booleanOrThenable ? booleanOrThenable : useThenable(booleanOrThenable),
            start
          ];
        },
        useSyncExternalStore: updateSyncExternalStore,
        useId: updateId,
        useHostTransitionStatus,
        useFormState: rerenderActionState,
        useActionState: rerenderActionState,
        useOptimistic: function(passthrough, reducer) {
          var hook = updateWorkInProgressHook();
          if (null !== currentHook)
            return updateOptimisticImpl(hook, currentHook, passthrough, reducer);
          hook.baseState = passthrough;
          return [passthrough, hook.queue.dispatch];
        },
        useMemoCache,
        useCacheRefresh: updateRefresh
      };
      HooksDispatcherOnRerender.useEffectEvent = updateEvent;
      function applyDerivedStateFromProps(workInProgress2, ctor, getDerivedStateFromProps, nextProps) {
        ctor = workInProgress2.memoizedState;
        getDerivedStateFromProps = getDerivedStateFromProps(nextProps, ctor);
        getDerivedStateFromProps = null === getDerivedStateFromProps || void 0 === getDerivedStateFromProps ? ctor : assign({}, ctor, getDerivedStateFromProps);
        workInProgress2.memoizedState = getDerivedStateFromProps;
        0 === workInProgress2.lanes && (workInProgress2.updateQueue.baseState = getDerivedStateFromProps);
      }
      var classComponentUpdater = {
        enqueueSetState: function(inst, payload, callback) {
          inst = inst._reactInternals;
          var lane = requestUpdateLane(), update = createUpdate(lane);
          update.payload = payload;
          void 0 !== callback && null !== callback && (update.callback = callback);
          payload = enqueueUpdate(inst, update, lane);
          null !== payload && (scheduleUpdateOnFiber(payload, inst, lane), entangleTransitions(payload, inst, lane));
        },
        enqueueReplaceState: function(inst, payload, callback) {
          inst = inst._reactInternals;
          var lane = requestUpdateLane(), update = createUpdate(lane);
          update.tag = 1;
          update.payload = payload;
          void 0 !== callback && null !== callback && (update.callback = callback);
          payload = enqueueUpdate(inst, update, lane);
          null !== payload && (scheduleUpdateOnFiber(payload, inst, lane), entangleTransitions(payload, inst, lane));
        },
        enqueueForceUpdate: function(inst, callback) {
          inst = inst._reactInternals;
          var lane = requestUpdateLane(), update = createUpdate(lane);
          update.tag = 2;
          void 0 !== callback && null !== callback && (update.callback = callback);
          callback = enqueueUpdate(inst, update, lane);
          null !== callback && (scheduleUpdateOnFiber(callback, inst, lane), entangleTransitions(callback, inst, lane));
        }
      };
      function checkShouldComponentUpdate(workInProgress2, ctor, oldProps, newProps, oldState, newState, nextContext) {
        workInProgress2 = workInProgress2.stateNode;
        return "function" === typeof workInProgress2.shouldComponentUpdate ? workInProgress2.shouldComponentUpdate(newProps, newState, nextContext) : ctor.prototype && ctor.prototype.isPureReactComponent ? !shallowEqual(oldProps, newProps) || !shallowEqual(oldState, newState) : true;
      }
      function callComponentWillReceiveProps(workInProgress2, instance, newProps, nextContext) {
        workInProgress2 = instance.state;
        "function" === typeof instance.componentWillReceiveProps && instance.componentWillReceiveProps(newProps, nextContext);
        "function" === typeof instance.UNSAFE_componentWillReceiveProps && instance.UNSAFE_componentWillReceiveProps(newProps, nextContext);
        instance.state !== workInProgress2 && classComponentUpdater.enqueueReplaceState(instance, instance.state, null);
      }
      function resolveClassComponentProps(Component, baseProps) {
        var newProps = baseProps;
        if ("ref" in baseProps) {
          newProps = {};
          for (var propName in baseProps)
            "ref" !== propName && (newProps[propName] = baseProps[propName]);
        }
        if (Component = Component.defaultProps) {
          newProps === baseProps && (newProps = assign({}, newProps));
          for (var propName$73 in Component)
            void 0 === newProps[propName$73] && (newProps[propName$73] = Component[propName$73]);
        }
        return newProps;
      }
      function defaultOnUncaughtError(error) {
        reportGlobalError(error);
      }
      function defaultOnCaughtError(error) {
        console.error(error);
      }
      function defaultOnRecoverableError(error) {
        reportGlobalError(error);
      }
      function logUncaughtError(root2, errorInfo) {
        try {
          var onUncaughtError = root2.onUncaughtError;
          onUncaughtError(errorInfo.value, { componentStack: errorInfo.stack });
        } catch (e$74) {
          setTimeout(function() {
            throw e$74;
          });
        }
      }
      function logCaughtError(root2, boundary, errorInfo) {
        try {
          var onCaughtError = root2.onCaughtError;
          onCaughtError(errorInfo.value, {
            componentStack: errorInfo.stack,
            errorBoundary: 1 === boundary.tag ? boundary.stateNode : null
          });
        } catch (e$75) {
          setTimeout(function() {
            throw e$75;
          });
        }
      }
      function createRootErrorUpdate(root2, errorInfo, lane) {
        lane = createUpdate(lane);
        lane.tag = 3;
        lane.payload = { element: null };
        lane.callback = function() {
          logUncaughtError(root2, errorInfo);
        };
        return lane;
      }
      function createClassErrorUpdate(lane) {
        lane = createUpdate(lane);
        lane.tag = 3;
        return lane;
      }
      function initializeClassErrorUpdate(update, root2, fiber, errorInfo) {
        var getDerivedStateFromError = fiber.type.getDerivedStateFromError;
        if ("function" === typeof getDerivedStateFromError) {
          var error = errorInfo.value;
          update.payload = function() {
            return getDerivedStateFromError(error);
          };
          update.callback = function() {
            logCaughtError(root2, fiber, errorInfo);
          };
        }
        var inst = fiber.stateNode;
        null !== inst && "function" === typeof inst.componentDidCatch && (update.callback = function() {
          logCaughtError(root2, fiber, errorInfo);
          "function" !== typeof getDerivedStateFromError && (null === legacyErrorBoundariesThatAlreadyFailed ? legacyErrorBoundariesThatAlreadyFailed = /* @__PURE__ */ new Set([this]) : legacyErrorBoundariesThatAlreadyFailed.add(this));
          var stack = errorInfo.stack;
          this.componentDidCatch(errorInfo.value, {
            componentStack: null !== stack ? stack : ""
          });
        });
      }
      function throwException(root2, returnFiber, sourceFiber, value, rootRenderLanes) {
        sourceFiber.flags |= 32768;
        if (null !== value && "object" === typeof value && "function" === typeof value.then) {
          returnFiber = sourceFiber.alternate;
          null !== returnFiber && propagateParentContextChanges(
            returnFiber,
            sourceFiber,
            rootRenderLanes,
            true
          );
          sourceFiber = suspenseHandlerStackCursor.current;
          if (null !== sourceFiber) {
            switch (sourceFiber.tag) {
              case 31:
              case 13:
                return null === shellBoundary ? renderDidSuspendDelayIfPossible() : null === sourceFiber.alternate && 0 === workInProgressRootExitStatus && (workInProgressRootExitStatus = 3), sourceFiber.flags &= -257, sourceFiber.flags |= 65536, sourceFiber.lanes = rootRenderLanes, value === noopSuspenseyCommitThenable ? sourceFiber.flags |= 16384 : (returnFiber = sourceFiber.updateQueue, null === returnFiber ? sourceFiber.updateQueue = /* @__PURE__ */ new Set([value]) : returnFiber.add(value), attachPingListener(root2, value, rootRenderLanes)), false;
              case 22:
                return sourceFiber.flags |= 65536, value === noopSuspenseyCommitThenable ? sourceFiber.flags |= 16384 : (returnFiber = sourceFiber.updateQueue, null === returnFiber ? (returnFiber = {
                  transitions: null,
                  markerInstances: null,
                  retryQueue: /* @__PURE__ */ new Set([value])
                }, sourceFiber.updateQueue = returnFiber) : (sourceFiber = returnFiber.retryQueue, null === sourceFiber ? returnFiber.retryQueue = /* @__PURE__ */ new Set([value]) : sourceFiber.add(value)), attachPingListener(root2, value, rootRenderLanes)), false;
            }
            throw Error(formatProdErrorMessage(435, sourceFiber.tag));
          }
          attachPingListener(root2, value, rootRenderLanes);
          renderDidSuspendDelayIfPossible();
          return false;
        }
        if (isHydrating)
          return returnFiber = suspenseHandlerStackCursor.current, null !== returnFiber ? (0 === (returnFiber.flags & 65536) && (returnFiber.flags |= 256), returnFiber.flags |= 65536, returnFiber.lanes = rootRenderLanes, value !== HydrationMismatchException && (root2 = Error(formatProdErrorMessage(422), { cause: value }), queueHydrationError(createCapturedValueAtFiber(root2, sourceFiber)))) : (value !== HydrationMismatchException && (returnFiber = Error(formatProdErrorMessage(423), {
            cause: value
          }), queueHydrationError(
            createCapturedValueAtFiber(returnFiber, sourceFiber)
          )), root2 = root2.current.alternate, root2.flags |= 65536, rootRenderLanes &= -rootRenderLanes, root2.lanes |= rootRenderLanes, value = createCapturedValueAtFiber(value, sourceFiber), rootRenderLanes = createRootErrorUpdate(
            root2.stateNode,
            value,
            rootRenderLanes
          ), enqueueCapturedUpdate(root2, rootRenderLanes), 4 !== workInProgressRootExitStatus && (workInProgressRootExitStatus = 2)), false;
        var wrapperError = Error(formatProdErrorMessage(520), { cause: value });
        wrapperError = createCapturedValueAtFiber(wrapperError, sourceFiber);
        null === workInProgressRootConcurrentErrors ? workInProgressRootConcurrentErrors = [wrapperError] : workInProgressRootConcurrentErrors.push(wrapperError);
        4 !== workInProgressRootExitStatus && (workInProgressRootExitStatus = 2);
        if (null === returnFiber) return true;
        value = createCapturedValueAtFiber(value, sourceFiber);
        sourceFiber = returnFiber;
        do {
          switch (sourceFiber.tag) {
            case 3:
              return sourceFiber.flags |= 65536, root2 = rootRenderLanes & -rootRenderLanes, sourceFiber.lanes |= root2, root2 = createRootErrorUpdate(sourceFiber.stateNode, value, root2), enqueueCapturedUpdate(sourceFiber, root2), false;
            case 1:
              if (returnFiber = sourceFiber.type, wrapperError = sourceFiber.stateNode, 0 === (sourceFiber.flags & 128) && ("function" === typeof returnFiber.getDerivedStateFromError || null !== wrapperError && "function" === typeof wrapperError.componentDidCatch && (null === legacyErrorBoundariesThatAlreadyFailed || !legacyErrorBoundariesThatAlreadyFailed.has(wrapperError))))
                return sourceFiber.flags |= 65536, rootRenderLanes &= -rootRenderLanes, sourceFiber.lanes |= rootRenderLanes, rootRenderLanes = createClassErrorUpdate(rootRenderLanes), initializeClassErrorUpdate(
                  rootRenderLanes,
                  root2,
                  sourceFiber,
                  value
                ), enqueueCapturedUpdate(sourceFiber, rootRenderLanes), false;
          }
          sourceFiber = sourceFiber.return;
        } while (null !== sourceFiber);
        return false;
      }
      var SelectiveHydrationException = Error(formatProdErrorMessage(461));
      var didReceiveUpdate = false;
      function reconcileChildren(current, workInProgress2, nextChildren, renderLanes2) {
        workInProgress2.child = null === current ? mountChildFibers(workInProgress2, null, nextChildren, renderLanes2) : reconcileChildFibers(
          workInProgress2,
          current.child,
          nextChildren,
          renderLanes2
        );
      }
      function updateForwardRef(current, workInProgress2, Component, nextProps, renderLanes2) {
        Component = Component.render;
        var ref = workInProgress2.ref;
        if ("ref" in nextProps) {
          var propsWithoutRef = {};
          for (var key in nextProps)
            "ref" !== key && (propsWithoutRef[key] = nextProps[key]);
        } else propsWithoutRef = nextProps;
        prepareToReadContext(workInProgress2);
        nextProps = renderWithHooks(
          current,
          workInProgress2,
          Component,
          propsWithoutRef,
          ref,
          renderLanes2
        );
        key = checkDidRenderIdHook();
        if (null !== current && !didReceiveUpdate)
          return bailoutHooks(current, workInProgress2, renderLanes2), bailoutOnAlreadyFinishedWork(current, workInProgress2, renderLanes2);
        isHydrating && key && pushMaterializedTreeId(workInProgress2);
        workInProgress2.flags |= 1;
        reconcileChildren(current, workInProgress2, nextProps, renderLanes2);
        return workInProgress2.child;
      }
      function updateMemoComponent(current, workInProgress2, Component, nextProps, renderLanes2) {
        if (null === current) {
          var type = Component.type;
          if ("function" === typeof type && !shouldConstruct(type) && void 0 === type.defaultProps && null === Component.compare)
            return workInProgress2.tag = 15, workInProgress2.type = type, updateSimpleMemoComponent(
              current,
              workInProgress2,
              type,
              nextProps,
              renderLanes2
            );
          current = createFiberFromTypeAndProps(
            Component.type,
            null,
            nextProps,
            workInProgress2,
            workInProgress2.mode,
            renderLanes2
          );
          current.ref = workInProgress2.ref;
          current.return = workInProgress2;
          return workInProgress2.child = current;
        }
        type = current.child;
        if (!checkScheduledUpdateOrContext(current, renderLanes2)) {
          var prevProps = type.memoizedProps;
          Component = Component.compare;
          Component = null !== Component ? Component : shallowEqual;
          if (Component(prevProps, nextProps) && current.ref === workInProgress2.ref)
            return bailoutOnAlreadyFinishedWork(current, workInProgress2, renderLanes2);
        }
        workInProgress2.flags |= 1;
        current = createWorkInProgress(type, nextProps);
        current.ref = workInProgress2.ref;
        current.return = workInProgress2;
        return workInProgress2.child = current;
      }
      function updateSimpleMemoComponent(current, workInProgress2, Component, nextProps, renderLanes2) {
        if (null !== current) {
          var prevProps = current.memoizedProps;
          if (shallowEqual(prevProps, nextProps) && current.ref === workInProgress2.ref)
            if (didReceiveUpdate = false, workInProgress2.pendingProps = nextProps = prevProps, checkScheduledUpdateOrContext(current, renderLanes2))
              0 !== (current.flags & 131072) && (didReceiveUpdate = true);
            else
              return workInProgress2.lanes = current.lanes, bailoutOnAlreadyFinishedWork(current, workInProgress2, renderLanes2);
        }
        return updateFunctionComponent(
          current,
          workInProgress2,
          Component,
          nextProps,
          renderLanes2
        );
      }
      function updateOffscreenComponent(current, workInProgress2, renderLanes2, nextProps) {
        var nextChildren = nextProps.children, prevState = null !== current ? current.memoizedState : null;
        null === current && null === workInProgress2.stateNode && (workInProgress2.stateNode = {
          _visibility: 1,
          _pendingMarkers: null,
          _retryCache: null,
          _transitions: null
        });
        if ("hidden" === nextProps.mode) {
          if (0 !== (workInProgress2.flags & 128)) {
            prevState = null !== prevState ? prevState.baseLanes | renderLanes2 : renderLanes2;
            if (null !== current) {
              nextProps = workInProgress2.child = current.child;
              for (nextChildren = 0; null !== nextProps; )
                nextChildren = nextChildren | nextProps.lanes | nextProps.childLanes, nextProps = nextProps.sibling;
              nextProps = nextChildren & ~prevState;
            } else nextProps = 0, workInProgress2.child = null;
            return deferHiddenOffscreenComponent(
              current,
              workInProgress2,
              prevState,
              renderLanes2,
              nextProps
            );
          }
          if (0 !== (renderLanes2 & 536870912))
            workInProgress2.memoizedState = { baseLanes: 0, cachePool: null }, null !== current && pushTransition(
              workInProgress2,
              null !== prevState ? prevState.cachePool : null
            ), null !== prevState ? pushHiddenContext(workInProgress2, prevState) : reuseHiddenContextOnStack(), pushOffscreenSuspenseHandler(workInProgress2);
          else
            return nextProps = workInProgress2.lanes = 536870912, deferHiddenOffscreenComponent(
              current,
              workInProgress2,
              null !== prevState ? prevState.baseLanes | renderLanes2 : renderLanes2,
              renderLanes2,
              nextProps
            );
        } else
          null !== prevState ? (pushTransition(workInProgress2, prevState.cachePool), pushHiddenContext(workInProgress2, prevState), reuseSuspenseHandlerOnStack(workInProgress2), workInProgress2.memoizedState = null) : (null !== current && pushTransition(workInProgress2, null), reuseHiddenContextOnStack(), reuseSuspenseHandlerOnStack(workInProgress2));
        reconcileChildren(current, workInProgress2, nextChildren, renderLanes2);
        return workInProgress2.child;
      }
      function bailoutOffscreenComponent(current, workInProgress2) {
        null !== current && 22 === current.tag || null !== workInProgress2.stateNode || (workInProgress2.stateNode = {
          _visibility: 1,
          _pendingMarkers: null,
          _retryCache: null,
          _transitions: null
        });
        return workInProgress2.sibling;
      }
      function deferHiddenOffscreenComponent(current, workInProgress2, nextBaseLanes, renderLanes2, remainingChildLanes) {
        var JSCompiler_inline_result = peekCacheFromPool();
        JSCompiler_inline_result = null === JSCompiler_inline_result ? null : { parent: CacheContext._currentValue, pool: JSCompiler_inline_result };
        workInProgress2.memoizedState = {
          baseLanes: nextBaseLanes,
          cachePool: JSCompiler_inline_result
        };
        null !== current && pushTransition(workInProgress2, null);
        reuseHiddenContextOnStack();
        pushOffscreenSuspenseHandler(workInProgress2);
        null !== current && propagateParentContextChanges(current, workInProgress2, renderLanes2, true);
        workInProgress2.childLanes = remainingChildLanes;
        return null;
      }
      function mountActivityChildren(workInProgress2, nextProps) {
        nextProps = mountWorkInProgressOffscreenFiber(
          { mode: nextProps.mode, children: nextProps.children },
          workInProgress2.mode
        );
        nextProps.ref = workInProgress2.ref;
        workInProgress2.child = nextProps;
        nextProps.return = workInProgress2;
        return nextProps;
      }
      function retryActivityComponentWithoutHydrating(current, workInProgress2, renderLanes2) {
        reconcileChildFibers(workInProgress2, current.child, null, renderLanes2);
        current = mountActivityChildren(workInProgress2, workInProgress2.pendingProps);
        current.flags |= 2;
        popSuspenseHandler(workInProgress2);
        workInProgress2.memoizedState = null;
        return current;
      }
      function updateActivityComponent(current, workInProgress2, renderLanes2) {
        var nextProps = workInProgress2.pendingProps, didSuspend = 0 !== (workInProgress2.flags & 128);
        workInProgress2.flags &= -129;
        if (null === current) {
          if (isHydrating) {
            if ("hidden" === nextProps.mode)
              return current = mountActivityChildren(workInProgress2, nextProps), workInProgress2.lanes = 536870912, bailoutOffscreenComponent(null, current);
            pushDehydratedActivitySuspenseHandler(workInProgress2);
            (current = nextHydratableInstance) ? (current = canHydrateHydrationBoundary(
              current,
              rootOrSingletonContext
            ), current = null !== current && "&" === current.data ? current : null, null !== current && (workInProgress2.memoizedState = {
              dehydrated: current,
              treeContext: null !== treeContextProvider ? { id: treeContextId, overflow: treeContextOverflow } : null,
              retryLane: 536870912,
              hydrationErrors: null
            }, renderLanes2 = createFiberFromDehydratedFragment(current), renderLanes2.return = workInProgress2, workInProgress2.child = renderLanes2, hydrationParentFiber = workInProgress2, nextHydratableInstance = null)) : current = null;
            if (null === current) throw throwOnHydrationMismatch(workInProgress2);
            workInProgress2.lanes = 536870912;
            return null;
          }
          return mountActivityChildren(workInProgress2, nextProps);
        }
        var prevState = current.memoizedState;
        if (null !== prevState) {
          var dehydrated = prevState.dehydrated;
          pushDehydratedActivitySuspenseHandler(workInProgress2);
          if (didSuspend)
            if (workInProgress2.flags & 256)
              workInProgress2.flags &= -257, workInProgress2 = retryActivityComponentWithoutHydrating(
                current,
                workInProgress2,
                renderLanes2
              );
            else if (null !== workInProgress2.memoizedState)
              workInProgress2.child = current.child, workInProgress2.flags |= 128, workInProgress2 = null;
            else throw Error(formatProdErrorMessage(558));
          else if (didReceiveUpdate || propagateParentContextChanges(current, workInProgress2, renderLanes2, false), didSuspend = 0 !== (renderLanes2 & current.childLanes), didReceiveUpdate || didSuspend) {
            nextProps = workInProgressRoot;
            if (null !== nextProps && (dehydrated = getBumpedLaneForHydration(nextProps, renderLanes2), 0 !== dehydrated && dehydrated !== prevState.retryLane))
              throw prevState.retryLane = dehydrated, enqueueConcurrentRenderForLane(current, dehydrated), scheduleUpdateOnFiber(nextProps, current, dehydrated), SelectiveHydrationException;
            renderDidSuspendDelayIfPossible();
            workInProgress2 = retryActivityComponentWithoutHydrating(
              current,
              workInProgress2,
              renderLanes2
            );
          } else
            current = prevState.treeContext, nextHydratableInstance = getNextHydratable(dehydrated.nextSibling), hydrationParentFiber = workInProgress2, isHydrating = true, hydrationErrors = null, rootOrSingletonContext = false, null !== current && restoreSuspendedTreeContext(workInProgress2, current), workInProgress2 = mountActivityChildren(workInProgress2, nextProps), workInProgress2.flags |= 4096;
          return workInProgress2;
        }
        current = createWorkInProgress(current.child, {
          mode: nextProps.mode,
          children: nextProps.children
        });
        current.ref = workInProgress2.ref;
        workInProgress2.child = current;
        current.return = workInProgress2;
        return current;
      }
      function markRef(current, workInProgress2) {
        var ref = workInProgress2.ref;
        if (null === ref)
          null !== current && null !== current.ref && (workInProgress2.flags |= 4194816);
        else {
          if ("function" !== typeof ref && "object" !== typeof ref)
            throw Error(formatProdErrorMessage(284));
          if (null === current || current.ref !== ref)
            workInProgress2.flags |= 4194816;
        }
      }
      function updateFunctionComponent(current, workInProgress2, Component, nextProps, renderLanes2) {
        prepareToReadContext(workInProgress2);
        Component = renderWithHooks(
          current,
          workInProgress2,
          Component,
          nextProps,
          void 0,
          renderLanes2
        );
        nextProps = checkDidRenderIdHook();
        if (null !== current && !didReceiveUpdate)
          return bailoutHooks(current, workInProgress2, renderLanes2), bailoutOnAlreadyFinishedWork(current, workInProgress2, renderLanes2);
        isHydrating && nextProps && pushMaterializedTreeId(workInProgress2);
        workInProgress2.flags |= 1;
        reconcileChildren(current, workInProgress2, Component, renderLanes2);
        return workInProgress2.child;
      }
      function replayFunctionComponent(current, workInProgress2, nextProps, Component, secondArg, renderLanes2) {
        prepareToReadContext(workInProgress2);
        workInProgress2.updateQueue = null;
        nextProps = renderWithHooksAgain(
          workInProgress2,
          Component,
          nextProps,
          secondArg
        );
        finishRenderingHooks(current);
        Component = checkDidRenderIdHook();
        if (null !== current && !didReceiveUpdate)
          return bailoutHooks(current, workInProgress2, renderLanes2), bailoutOnAlreadyFinishedWork(current, workInProgress2, renderLanes2);
        isHydrating && Component && pushMaterializedTreeId(workInProgress2);
        workInProgress2.flags |= 1;
        reconcileChildren(current, workInProgress2, nextProps, renderLanes2);
        return workInProgress2.child;
      }
      function updateClassComponent(current, workInProgress2, Component, nextProps, renderLanes2) {
        prepareToReadContext(workInProgress2);
        if (null === workInProgress2.stateNode) {
          var context = emptyContextObject, contextType = Component.contextType;
          "object" === typeof contextType && null !== contextType && (context = readContext(contextType));
          context = new Component(nextProps, context);
          workInProgress2.memoizedState = null !== context.state && void 0 !== context.state ? context.state : null;
          context.updater = classComponentUpdater;
          workInProgress2.stateNode = context;
          context._reactInternals = workInProgress2;
          context = workInProgress2.stateNode;
          context.props = nextProps;
          context.state = workInProgress2.memoizedState;
          context.refs = {};
          initializeUpdateQueue(workInProgress2);
          contextType = Component.contextType;
          context.context = "object" === typeof contextType && null !== contextType ? readContext(contextType) : emptyContextObject;
          context.state = workInProgress2.memoizedState;
          contextType = Component.getDerivedStateFromProps;
          "function" === typeof contextType && (applyDerivedStateFromProps(
            workInProgress2,
            Component,
            contextType,
            nextProps
          ), context.state = workInProgress2.memoizedState);
          "function" === typeof Component.getDerivedStateFromProps || "function" === typeof context.getSnapshotBeforeUpdate || "function" !== typeof context.UNSAFE_componentWillMount && "function" !== typeof context.componentWillMount || (contextType = context.state, "function" === typeof context.componentWillMount && context.componentWillMount(), "function" === typeof context.UNSAFE_componentWillMount && context.UNSAFE_componentWillMount(), contextType !== context.state && classComponentUpdater.enqueueReplaceState(context, context.state, null), processUpdateQueue(workInProgress2, nextProps, context, renderLanes2), suspendIfUpdateReadFromEntangledAsyncAction(), context.state = workInProgress2.memoizedState);
          "function" === typeof context.componentDidMount && (workInProgress2.flags |= 4194308);
          nextProps = true;
        } else if (null === current) {
          context = workInProgress2.stateNode;
          var unresolvedOldProps = workInProgress2.memoizedProps, oldProps = resolveClassComponentProps(Component, unresolvedOldProps);
          context.props = oldProps;
          var oldContext = context.context, contextType$jscomp$0 = Component.contextType;
          contextType = emptyContextObject;
          "object" === typeof contextType$jscomp$0 && null !== contextType$jscomp$0 && (contextType = readContext(contextType$jscomp$0));
          var getDerivedStateFromProps = Component.getDerivedStateFromProps;
          contextType$jscomp$0 = "function" === typeof getDerivedStateFromProps || "function" === typeof context.getSnapshotBeforeUpdate;
          unresolvedOldProps = workInProgress2.pendingProps !== unresolvedOldProps;
          contextType$jscomp$0 || "function" !== typeof context.UNSAFE_componentWillReceiveProps && "function" !== typeof context.componentWillReceiveProps || (unresolvedOldProps || oldContext !== contextType) && callComponentWillReceiveProps(
            workInProgress2,
            context,
            nextProps,
            contextType
          );
          hasForceUpdate = false;
          var oldState = workInProgress2.memoizedState;
          context.state = oldState;
          processUpdateQueue(workInProgress2, nextProps, context, renderLanes2);
          suspendIfUpdateReadFromEntangledAsyncAction();
          oldContext = workInProgress2.memoizedState;
          unresolvedOldProps || oldState !== oldContext || hasForceUpdate ? ("function" === typeof getDerivedStateFromProps && (applyDerivedStateFromProps(
            workInProgress2,
            Component,
            getDerivedStateFromProps,
            nextProps
          ), oldContext = workInProgress2.memoizedState), (oldProps = hasForceUpdate || checkShouldComponentUpdate(
            workInProgress2,
            Component,
            oldProps,
            nextProps,
            oldState,
            oldContext,
            contextType
          )) ? (contextType$jscomp$0 || "function" !== typeof context.UNSAFE_componentWillMount && "function" !== typeof context.componentWillMount || ("function" === typeof context.componentWillMount && context.componentWillMount(), "function" === typeof context.UNSAFE_componentWillMount && context.UNSAFE_componentWillMount()), "function" === typeof context.componentDidMount && (workInProgress2.flags |= 4194308)) : ("function" === typeof context.componentDidMount && (workInProgress2.flags |= 4194308), workInProgress2.memoizedProps = nextProps, workInProgress2.memoizedState = oldContext), context.props = nextProps, context.state = oldContext, context.context = contextType, nextProps = oldProps) : ("function" === typeof context.componentDidMount && (workInProgress2.flags |= 4194308), nextProps = false);
        } else {
          context = workInProgress2.stateNode;
          cloneUpdateQueue(current, workInProgress2);
          contextType = workInProgress2.memoizedProps;
          contextType$jscomp$0 = resolveClassComponentProps(Component, contextType);
          context.props = contextType$jscomp$0;
          getDerivedStateFromProps = workInProgress2.pendingProps;
          oldState = context.context;
          oldContext = Component.contextType;
          oldProps = emptyContextObject;
          "object" === typeof oldContext && null !== oldContext && (oldProps = readContext(oldContext));
          unresolvedOldProps = Component.getDerivedStateFromProps;
          (oldContext = "function" === typeof unresolvedOldProps || "function" === typeof context.getSnapshotBeforeUpdate) || "function" !== typeof context.UNSAFE_componentWillReceiveProps && "function" !== typeof context.componentWillReceiveProps || (contextType !== getDerivedStateFromProps || oldState !== oldProps) && callComponentWillReceiveProps(
            workInProgress2,
            context,
            nextProps,
            oldProps
          );
          hasForceUpdate = false;
          oldState = workInProgress2.memoizedState;
          context.state = oldState;
          processUpdateQueue(workInProgress2, nextProps, context, renderLanes2);
          suspendIfUpdateReadFromEntangledAsyncAction();
          var newState = workInProgress2.memoizedState;
          contextType !== getDerivedStateFromProps || oldState !== newState || hasForceUpdate || null !== current && null !== current.dependencies && checkIfContextChanged(current.dependencies) ? ("function" === typeof unresolvedOldProps && (applyDerivedStateFromProps(
            workInProgress2,
            Component,
            unresolvedOldProps,
            nextProps
          ), newState = workInProgress2.memoizedState), (contextType$jscomp$0 = hasForceUpdate || checkShouldComponentUpdate(
            workInProgress2,
            Component,
            contextType$jscomp$0,
            nextProps,
            oldState,
            newState,
            oldProps
          ) || null !== current && null !== current.dependencies && checkIfContextChanged(current.dependencies)) ? (oldContext || "function" !== typeof context.UNSAFE_componentWillUpdate && "function" !== typeof context.componentWillUpdate || ("function" === typeof context.componentWillUpdate && context.componentWillUpdate(nextProps, newState, oldProps), "function" === typeof context.UNSAFE_componentWillUpdate && context.UNSAFE_componentWillUpdate(
            nextProps,
            newState,
            oldProps
          )), "function" === typeof context.componentDidUpdate && (workInProgress2.flags |= 4), "function" === typeof context.getSnapshotBeforeUpdate && (workInProgress2.flags |= 1024)) : ("function" !== typeof context.componentDidUpdate || contextType === current.memoizedProps && oldState === current.memoizedState || (workInProgress2.flags |= 4), "function" !== typeof context.getSnapshotBeforeUpdate || contextType === current.memoizedProps && oldState === current.memoizedState || (workInProgress2.flags |= 1024), workInProgress2.memoizedProps = nextProps, workInProgress2.memoizedState = newState), context.props = nextProps, context.state = newState, context.context = oldProps, nextProps = contextType$jscomp$0) : ("function" !== typeof context.componentDidUpdate || contextType === current.memoizedProps && oldState === current.memoizedState || (workInProgress2.flags |= 4), "function" !== typeof context.getSnapshotBeforeUpdate || contextType === current.memoizedProps && oldState === current.memoizedState || (workInProgress2.flags |= 1024), nextProps = false);
        }
        context = nextProps;
        markRef(current, workInProgress2);
        nextProps = 0 !== (workInProgress2.flags & 128);
        context || nextProps ? (context = workInProgress2.stateNode, Component = nextProps && "function" !== typeof Component.getDerivedStateFromError ? null : context.render(), workInProgress2.flags |= 1, null !== current && nextProps ? (workInProgress2.child = reconcileChildFibers(
          workInProgress2,
          current.child,
          null,
          renderLanes2
        ), workInProgress2.child = reconcileChildFibers(
          workInProgress2,
          null,
          Component,
          renderLanes2
        )) : reconcileChildren(current, workInProgress2, Component, renderLanes2), workInProgress2.memoizedState = context.state, current = workInProgress2.child) : current = bailoutOnAlreadyFinishedWork(
          current,
          workInProgress2,
          renderLanes2
        );
        return current;
      }
      function mountHostRootWithoutHydrating(current, workInProgress2, nextChildren, renderLanes2) {
        resetHydrationState();
        workInProgress2.flags |= 256;
        reconcileChildren(current, workInProgress2, nextChildren, renderLanes2);
        return workInProgress2.child;
      }
      var SUSPENDED_MARKER = {
        dehydrated: null,
        treeContext: null,
        retryLane: 0,
        hydrationErrors: null
      };
      function mountSuspenseOffscreenState(renderLanes2) {
        return { baseLanes: renderLanes2, cachePool: getSuspendedCache() };
      }
      function getRemainingWorkInPrimaryTree(current, primaryTreeDidDefer, renderLanes2) {
        current = null !== current ? current.childLanes & ~renderLanes2 : 0;
        primaryTreeDidDefer && (current |= workInProgressDeferredLane);
        return current;
      }
      function updateSuspenseComponent(current, workInProgress2, renderLanes2) {
        var nextProps = workInProgress2.pendingProps, showFallback = false, didSuspend = 0 !== (workInProgress2.flags & 128), JSCompiler_temp;
        (JSCompiler_temp = didSuspend) || (JSCompiler_temp = null !== current && null === current.memoizedState ? false : 0 !== (suspenseStackCursor.current & 2));
        JSCompiler_temp && (showFallback = true, workInProgress2.flags &= -129);
        JSCompiler_temp = 0 !== (workInProgress2.flags & 32);
        workInProgress2.flags &= -33;
        if (null === current) {
          if (isHydrating) {
            showFallback ? pushPrimaryTreeSuspenseHandler(workInProgress2) : reuseSuspenseHandlerOnStack(workInProgress2);
            (current = nextHydratableInstance) ? (current = canHydrateHydrationBoundary(
              current,
              rootOrSingletonContext
            ), current = null !== current && "&" !== current.data ? current : null, null !== current && (workInProgress2.memoizedState = {
              dehydrated: current,
              treeContext: null !== treeContextProvider ? { id: treeContextId, overflow: treeContextOverflow } : null,
              retryLane: 536870912,
              hydrationErrors: null
            }, renderLanes2 = createFiberFromDehydratedFragment(current), renderLanes2.return = workInProgress2, workInProgress2.child = renderLanes2, hydrationParentFiber = workInProgress2, nextHydratableInstance = null)) : current = null;
            if (null === current) throw throwOnHydrationMismatch(workInProgress2);
            isSuspenseInstanceFallback(current) ? workInProgress2.lanes = 32 : workInProgress2.lanes = 536870912;
            return null;
          }
          var nextPrimaryChildren = nextProps.children;
          nextProps = nextProps.fallback;
          if (showFallback)
            return reuseSuspenseHandlerOnStack(workInProgress2), showFallback = workInProgress2.mode, nextPrimaryChildren = mountWorkInProgressOffscreenFiber(
              { mode: "hidden", children: nextPrimaryChildren },
              showFallback
            ), nextProps = createFiberFromFragment(
              nextProps,
              showFallback,
              renderLanes2,
              null
            ), nextPrimaryChildren.return = workInProgress2, nextProps.return = workInProgress2, nextPrimaryChildren.sibling = nextProps, workInProgress2.child = nextPrimaryChildren, nextProps = workInProgress2.child, nextProps.memoizedState = mountSuspenseOffscreenState(renderLanes2), nextProps.childLanes = getRemainingWorkInPrimaryTree(
              current,
              JSCompiler_temp,
              renderLanes2
            ), workInProgress2.memoizedState = SUSPENDED_MARKER, bailoutOffscreenComponent(null, nextProps);
          pushPrimaryTreeSuspenseHandler(workInProgress2);
          return mountSuspensePrimaryChildren(workInProgress2, nextPrimaryChildren);
        }
        var prevState = current.memoizedState;
        if (null !== prevState && (nextPrimaryChildren = prevState.dehydrated, null !== nextPrimaryChildren)) {
          if (didSuspend)
            workInProgress2.flags & 256 ? (pushPrimaryTreeSuspenseHandler(workInProgress2), workInProgress2.flags &= -257, workInProgress2 = retrySuspenseComponentWithoutHydrating(
              current,
              workInProgress2,
              renderLanes2
            )) : null !== workInProgress2.memoizedState ? (reuseSuspenseHandlerOnStack(workInProgress2), workInProgress2.child = current.child, workInProgress2.flags |= 128, workInProgress2 = null) : (reuseSuspenseHandlerOnStack(workInProgress2), nextPrimaryChildren = nextProps.fallback, showFallback = workInProgress2.mode, nextProps = mountWorkInProgressOffscreenFiber(
              { mode: "visible", children: nextProps.children },
              showFallback
            ), nextPrimaryChildren = createFiberFromFragment(
              nextPrimaryChildren,
              showFallback,
              renderLanes2,
              null
            ), nextPrimaryChildren.flags |= 2, nextProps.return = workInProgress2, nextPrimaryChildren.return = workInProgress2, nextProps.sibling = nextPrimaryChildren, workInProgress2.child = nextProps, reconcileChildFibers(
              workInProgress2,
              current.child,
              null,
              renderLanes2
            ), nextProps = workInProgress2.child, nextProps.memoizedState = mountSuspenseOffscreenState(renderLanes2), nextProps.childLanes = getRemainingWorkInPrimaryTree(
              current,
              JSCompiler_temp,
              renderLanes2
            ), workInProgress2.memoizedState = SUSPENDED_MARKER, workInProgress2 = bailoutOffscreenComponent(null, nextProps));
          else if (pushPrimaryTreeSuspenseHandler(workInProgress2), isSuspenseInstanceFallback(nextPrimaryChildren)) {
            JSCompiler_temp = nextPrimaryChildren.nextSibling && nextPrimaryChildren.nextSibling.dataset;
            if (JSCompiler_temp) var digest = JSCompiler_temp.dgst;
            JSCompiler_temp = digest;
            nextProps = Error(formatProdErrorMessage(419));
            nextProps.stack = "";
            nextProps.digest = JSCompiler_temp;
            queueHydrationError({ value: nextProps, source: null, stack: null });
            workInProgress2 = retrySuspenseComponentWithoutHydrating(
              current,
              workInProgress2,
              renderLanes2
            );
          } else if (didReceiveUpdate || propagateParentContextChanges(current, workInProgress2, renderLanes2, false), JSCompiler_temp = 0 !== (renderLanes2 & current.childLanes), didReceiveUpdate || JSCompiler_temp) {
            JSCompiler_temp = workInProgressRoot;
            if (null !== JSCompiler_temp && (nextProps = getBumpedLaneForHydration(JSCompiler_temp, renderLanes2), 0 !== nextProps && nextProps !== prevState.retryLane))
              throw prevState.retryLane = nextProps, enqueueConcurrentRenderForLane(current, nextProps), scheduleUpdateOnFiber(JSCompiler_temp, current, nextProps), SelectiveHydrationException;
            isSuspenseInstancePending(nextPrimaryChildren) || renderDidSuspendDelayIfPossible();
            workInProgress2 = retrySuspenseComponentWithoutHydrating(
              current,
              workInProgress2,
              renderLanes2
            );
          } else
            isSuspenseInstancePending(nextPrimaryChildren) ? (workInProgress2.flags |= 192, workInProgress2.child = current.child, workInProgress2 = null) : (current = prevState.treeContext, nextHydratableInstance = getNextHydratable(
              nextPrimaryChildren.nextSibling
            ), hydrationParentFiber = workInProgress2, isHydrating = true, hydrationErrors = null, rootOrSingletonContext = false, null !== current && restoreSuspendedTreeContext(workInProgress2, current), workInProgress2 = mountSuspensePrimaryChildren(
              workInProgress2,
              nextProps.children
            ), workInProgress2.flags |= 4096);
          return workInProgress2;
        }
        if (showFallback)
          return reuseSuspenseHandlerOnStack(workInProgress2), nextPrimaryChildren = nextProps.fallback, showFallback = workInProgress2.mode, prevState = current.child, digest = prevState.sibling, nextProps = createWorkInProgress(prevState, {
            mode: "hidden",
            children: nextProps.children
          }), nextProps.subtreeFlags = prevState.subtreeFlags & 65011712, null !== digest ? nextPrimaryChildren = createWorkInProgress(
            digest,
            nextPrimaryChildren
          ) : (nextPrimaryChildren = createFiberFromFragment(
            nextPrimaryChildren,
            showFallback,
            renderLanes2,
            null
          ), nextPrimaryChildren.flags |= 2), nextPrimaryChildren.return = workInProgress2, nextProps.return = workInProgress2, nextProps.sibling = nextPrimaryChildren, workInProgress2.child = nextProps, bailoutOffscreenComponent(null, nextProps), nextProps = workInProgress2.child, nextPrimaryChildren = current.child.memoizedState, null === nextPrimaryChildren ? nextPrimaryChildren = mountSuspenseOffscreenState(renderLanes2) : (showFallback = nextPrimaryChildren.cachePool, null !== showFallback ? (prevState = CacheContext._currentValue, showFallback = showFallback.parent !== prevState ? { parent: prevState, pool: prevState } : showFallback) : showFallback = getSuspendedCache(), nextPrimaryChildren = {
            baseLanes: nextPrimaryChildren.baseLanes | renderLanes2,
            cachePool: showFallback
          }), nextProps.memoizedState = nextPrimaryChildren, nextProps.childLanes = getRemainingWorkInPrimaryTree(
            current,
            JSCompiler_temp,
            renderLanes2
          ), workInProgress2.memoizedState = SUSPENDED_MARKER, bailoutOffscreenComponent(current.child, nextProps);
        pushPrimaryTreeSuspenseHandler(workInProgress2);
        renderLanes2 = current.child;
        current = renderLanes2.sibling;
        renderLanes2 = createWorkInProgress(renderLanes2, {
          mode: "visible",
          children: nextProps.children
        });
        renderLanes2.return = workInProgress2;
        renderLanes2.sibling = null;
        null !== current && (JSCompiler_temp = workInProgress2.deletions, null === JSCompiler_temp ? (workInProgress2.deletions = [current], workInProgress2.flags |= 16) : JSCompiler_temp.push(current));
        workInProgress2.child = renderLanes2;
        workInProgress2.memoizedState = null;
        return renderLanes2;
      }
      function mountSuspensePrimaryChildren(workInProgress2, primaryChildren) {
        primaryChildren = mountWorkInProgressOffscreenFiber(
          { mode: "visible", children: primaryChildren },
          workInProgress2.mode
        );
        primaryChildren.return = workInProgress2;
        return workInProgress2.child = primaryChildren;
      }
      function mountWorkInProgressOffscreenFiber(offscreenProps, mode) {
        offscreenProps = createFiberImplClass(22, offscreenProps, null, mode);
        offscreenProps.lanes = 0;
        return offscreenProps;
      }
      function retrySuspenseComponentWithoutHydrating(current, workInProgress2, renderLanes2) {
        reconcileChildFibers(workInProgress2, current.child, null, renderLanes2);
        current = mountSuspensePrimaryChildren(
          workInProgress2,
          workInProgress2.pendingProps.children
        );
        current.flags |= 2;
        workInProgress2.memoizedState = null;
        return current;
      }
      function scheduleSuspenseWorkOnFiber(fiber, renderLanes2, propagationRoot) {
        fiber.lanes |= renderLanes2;
        var alternate = fiber.alternate;
        null !== alternate && (alternate.lanes |= renderLanes2);
        scheduleContextWorkOnParentPath(fiber.return, renderLanes2, propagationRoot);
      }
      function initSuspenseListRenderState(workInProgress2, isBackwards, tail, lastContentRow, tailMode, treeForkCount2) {
        var renderState = workInProgress2.memoizedState;
        null === renderState ? workInProgress2.memoizedState = {
          isBackwards,
          rendering: null,
          renderingStartTime: 0,
          last: lastContentRow,
          tail,
          tailMode,
          treeForkCount: treeForkCount2
        } : (renderState.isBackwards = isBackwards, renderState.rendering = null, renderState.renderingStartTime = 0, renderState.last = lastContentRow, renderState.tail = tail, renderState.tailMode = tailMode, renderState.treeForkCount = treeForkCount2);
      }
      function updateSuspenseListComponent(current, workInProgress2, renderLanes2) {
        var nextProps = workInProgress2.pendingProps, revealOrder = nextProps.revealOrder, tailMode = nextProps.tail;
        nextProps = nextProps.children;
        var suspenseContext = suspenseStackCursor.current, shouldForceFallback = 0 !== (suspenseContext & 2);
        shouldForceFallback ? (suspenseContext = suspenseContext & 1 | 2, workInProgress2.flags |= 128) : suspenseContext &= 1;
        push(suspenseStackCursor, suspenseContext);
        reconcileChildren(current, workInProgress2, nextProps, renderLanes2);
        nextProps = isHydrating ? treeForkCount : 0;
        if (!shouldForceFallback && null !== current && 0 !== (current.flags & 128))
          a: for (current = workInProgress2.child; null !== current; ) {
            if (13 === current.tag)
              null !== current.memoizedState && scheduleSuspenseWorkOnFiber(current, renderLanes2, workInProgress2);
            else if (19 === current.tag)
              scheduleSuspenseWorkOnFiber(current, renderLanes2, workInProgress2);
            else if (null !== current.child) {
              current.child.return = current;
              current = current.child;
              continue;
            }
            if (current === workInProgress2) break a;
            for (; null === current.sibling; ) {
              if (null === current.return || current.return === workInProgress2)
                break a;
              current = current.return;
            }
            current.sibling.return = current.return;
            current = current.sibling;
          }
        switch (revealOrder) {
          case "forwards":
            renderLanes2 = workInProgress2.child;
            for (revealOrder = null; null !== renderLanes2; )
              current = renderLanes2.alternate, null !== current && null === findFirstSuspended(current) && (revealOrder = renderLanes2), renderLanes2 = renderLanes2.sibling;
            renderLanes2 = revealOrder;
            null === renderLanes2 ? (revealOrder = workInProgress2.child, workInProgress2.child = null) : (revealOrder = renderLanes2.sibling, renderLanes2.sibling = null);
            initSuspenseListRenderState(
              workInProgress2,
              false,
              revealOrder,
              renderLanes2,
              tailMode,
              nextProps
            );
            break;
          case "backwards":
          case "unstable_legacy-backwards":
            renderLanes2 = null;
            revealOrder = workInProgress2.child;
            for (workInProgress2.child = null; null !== revealOrder; ) {
              current = revealOrder.alternate;
              if (null !== current && null === findFirstSuspended(current)) {
                workInProgress2.child = revealOrder;
                break;
              }
              current = revealOrder.sibling;
              revealOrder.sibling = renderLanes2;
              renderLanes2 = revealOrder;
              revealOrder = current;
            }
            initSuspenseListRenderState(
              workInProgress2,
              true,
              renderLanes2,
              null,
              tailMode,
              nextProps
            );
            break;
          case "together":
            initSuspenseListRenderState(
              workInProgress2,
              false,
              null,
              null,
              void 0,
              nextProps
            );
            break;
          default:
            workInProgress2.memoizedState = null;
        }
        return workInProgress2.child;
      }
      function bailoutOnAlreadyFinishedWork(current, workInProgress2, renderLanes2) {
        null !== current && (workInProgress2.dependencies = current.dependencies);
        workInProgressRootSkippedLanes |= workInProgress2.lanes;
        if (0 === (renderLanes2 & workInProgress2.childLanes))
          if (null !== current) {
            if (propagateParentContextChanges(
              current,
              workInProgress2,
              renderLanes2,
              false
            ), 0 === (renderLanes2 & workInProgress2.childLanes))
              return null;
          } else return null;
        if (null !== current && workInProgress2.child !== current.child)
          throw Error(formatProdErrorMessage(153));
        if (null !== workInProgress2.child) {
          current = workInProgress2.child;
          renderLanes2 = createWorkInProgress(current, current.pendingProps);
          workInProgress2.child = renderLanes2;
          for (renderLanes2.return = workInProgress2; null !== current.sibling; )
            current = current.sibling, renderLanes2 = renderLanes2.sibling = createWorkInProgress(current, current.pendingProps), renderLanes2.return = workInProgress2;
          renderLanes2.sibling = null;
        }
        return workInProgress2.child;
      }
      function checkScheduledUpdateOrContext(current, renderLanes2) {
        if (0 !== (current.lanes & renderLanes2)) return true;
        current = current.dependencies;
        return null !== current && checkIfContextChanged(current) ? true : false;
      }
      function attemptEarlyBailoutIfNoScheduledUpdate(current, workInProgress2, renderLanes2) {
        switch (workInProgress2.tag) {
          case 3:
            pushHostContainer(workInProgress2, workInProgress2.stateNode.containerInfo);
            pushProvider(workInProgress2, CacheContext, current.memoizedState.cache);
            resetHydrationState();
            break;
          case 27:
          case 5:
            pushHostContext(workInProgress2);
            break;
          case 4:
            pushHostContainer(workInProgress2, workInProgress2.stateNode.containerInfo);
            break;
          case 10:
            pushProvider(
              workInProgress2,
              workInProgress2.type,
              workInProgress2.memoizedProps.value
            );
            break;
          case 31:
            if (null !== workInProgress2.memoizedState)
              return workInProgress2.flags |= 128, pushDehydratedActivitySuspenseHandler(workInProgress2), null;
            break;
          case 13:
            var state$102 = workInProgress2.memoizedState;
            if (null !== state$102) {
              if (null !== state$102.dehydrated)
                return pushPrimaryTreeSuspenseHandler(workInProgress2), workInProgress2.flags |= 128, null;
              if (0 !== (renderLanes2 & workInProgress2.child.childLanes))
                return updateSuspenseComponent(current, workInProgress2, renderLanes2);
              pushPrimaryTreeSuspenseHandler(workInProgress2);
              current = bailoutOnAlreadyFinishedWork(
                current,
                workInProgress2,
                renderLanes2
              );
              return null !== current ? current.sibling : null;
            }
            pushPrimaryTreeSuspenseHandler(workInProgress2);
            break;
          case 19:
            var didSuspendBefore = 0 !== (current.flags & 128);
            state$102 = 0 !== (renderLanes2 & workInProgress2.childLanes);
            state$102 || (propagateParentContextChanges(
              current,
              workInProgress2,
              renderLanes2,
              false
            ), state$102 = 0 !== (renderLanes2 & workInProgress2.childLanes));
            if (didSuspendBefore) {
              if (state$102)
                return updateSuspenseListComponent(
                  current,
                  workInProgress2,
                  renderLanes2
                );
              workInProgress2.flags |= 128;
            }
            didSuspendBefore = workInProgress2.memoizedState;
            null !== didSuspendBefore && (didSuspendBefore.rendering = null, didSuspendBefore.tail = null, didSuspendBefore.lastEffect = null);
            push(suspenseStackCursor, suspenseStackCursor.current);
            if (state$102) break;
            else return null;
          case 22:
            return workInProgress2.lanes = 0, updateOffscreenComponent(
              current,
              workInProgress2,
              renderLanes2,
              workInProgress2.pendingProps
            );
          case 24:
            pushProvider(workInProgress2, CacheContext, current.memoizedState.cache);
        }
        return bailoutOnAlreadyFinishedWork(current, workInProgress2, renderLanes2);
      }
      function beginWork(current, workInProgress2, renderLanes2) {
        if (null !== current)
          if (current.memoizedProps !== workInProgress2.pendingProps)
            didReceiveUpdate = true;
          else {
            if (!checkScheduledUpdateOrContext(current, renderLanes2) && 0 === (workInProgress2.flags & 128))
              return didReceiveUpdate = false, attemptEarlyBailoutIfNoScheduledUpdate(
                current,
                workInProgress2,
                renderLanes2
              );
            didReceiveUpdate = 0 !== (current.flags & 131072) ? true : false;
          }
        else
          didReceiveUpdate = false, isHydrating && 0 !== (workInProgress2.flags & 1048576) && pushTreeId(workInProgress2, treeForkCount, workInProgress2.index);
        workInProgress2.lanes = 0;
        switch (workInProgress2.tag) {
          case 16:
            a: {
              var props = workInProgress2.pendingProps;
              current = resolveLazy(workInProgress2.elementType);
              workInProgress2.type = current;
              if ("function" === typeof current)
                shouldConstruct(current) ? (props = resolveClassComponentProps(current, props), workInProgress2.tag = 1, workInProgress2 = updateClassComponent(
                  null,
                  workInProgress2,
                  current,
                  props,
                  renderLanes2
                )) : (workInProgress2.tag = 0, workInProgress2 = updateFunctionComponent(
                  null,
                  workInProgress2,
                  current,
                  props,
                  renderLanes2
                ));
              else {
                if (void 0 !== current && null !== current) {
                  var $$typeof = current.$$typeof;
                  if ($$typeof === REACT_FORWARD_REF_TYPE) {
                    workInProgress2.tag = 11;
                    workInProgress2 = updateForwardRef(
                      null,
                      workInProgress2,
                      current,
                      props,
                      renderLanes2
                    );
                    break a;
                  } else if ($$typeof === REACT_MEMO_TYPE) {
                    workInProgress2.tag = 14;
                    workInProgress2 = updateMemoComponent(
                      null,
                      workInProgress2,
                      current,
                      props,
                      renderLanes2
                    );
                    break a;
                  }
                }
                workInProgress2 = getComponentNameFromType(current) || current;
                throw Error(formatProdErrorMessage(306, workInProgress2, ""));
              }
            }
            return workInProgress2;
          case 0:
            return updateFunctionComponent(
              current,
              workInProgress2,
              workInProgress2.type,
              workInProgress2.pendingProps,
              renderLanes2
            );
          case 1:
            return props = workInProgress2.type, $$typeof = resolveClassComponentProps(
              props,
              workInProgress2.pendingProps
            ), updateClassComponent(
              current,
              workInProgress2,
              props,
              $$typeof,
              renderLanes2
            );
          case 3:
            a: {
              pushHostContainer(
                workInProgress2,
                workInProgress2.stateNode.containerInfo
              );
              if (null === current) throw Error(formatProdErrorMessage(387));
              props = workInProgress2.pendingProps;
              var prevState = workInProgress2.memoizedState;
              $$typeof = prevState.element;
              cloneUpdateQueue(current, workInProgress2);
              processUpdateQueue(workInProgress2, props, null, renderLanes2);
              var nextState = workInProgress2.memoizedState;
              props = nextState.cache;
              pushProvider(workInProgress2, CacheContext, props);
              props !== prevState.cache && propagateContextChanges(
                workInProgress2,
                [CacheContext],
                renderLanes2,
                true
              );
              suspendIfUpdateReadFromEntangledAsyncAction();
              props = nextState.element;
              if (prevState.isDehydrated)
                if (prevState = {
                  element: props,
                  isDehydrated: false,
                  cache: nextState.cache
                }, workInProgress2.updateQueue.baseState = prevState, workInProgress2.memoizedState = prevState, workInProgress2.flags & 256) {
                  workInProgress2 = mountHostRootWithoutHydrating(
                    current,
                    workInProgress2,
                    props,
                    renderLanes2
                  );
                  break a;
                } else if (props !== $$typeof) {
                  $$typeof = createCapturedValueAtFiber(
                    Error(formatProdErrorMessage(424)),
                    workInProgress2
                  );
                  queueHydrationError($$typeof);
                  workInProgress2 = mountHostRootWithoutHydrating(
                    current,
                    workInProgress2,
                    props,
                    renderLanes2
                  );
                  break a;
                } else {
                  current = workInProgress2.stateNode.containerInfo;
                  switch (current.nodeType) {
                    case 9:
                      current = current.body;
                      break;
                    default:
                      current = "HTML" === current.nodeName ? current.ownerDocument.body : current;
                  }
                  nextHydratableInstance = getNextHydratable(current.firstChild);
                  hydrationParentFiber = workInProgress2;
                  isHydrating = true;
                  hydrationErrors = null;
                  rootOrSingletonContext = true;
                  renderLanes2 = mountChildFibers(
                    workInProgress2,
                    null,
                    props,
                    renderLanes2
                  );
                  for (workInProgress2.child = renderLanes2; renderLanes2; )
                    renderLanes2.flags = renderLanes2.flags & -3 | 4096, renderLanes2 = renderLanes2.sibling;
                }
              else {
                resetHydrationState();
                if (props === $$typeof) {
                  workInProgress2 = bailoutOnAlreadyFinishedWork(
                    current,
                    workInProgress2,
                    renderLanes2
                  );
                  break a;
                }
                reconcileChildren(current, workInProgress2, props, renderLanes2);
              }
              workInProgress2 = workInProgress2.child;
            }
            return workInProgress2;
          case 26:
            return markRef(current, workInProgress2), null === current ? (renderLanes2 = getResource(
              workInProgress2.type,
              null,
              workInProgress2.pendingProps,
              null
            )) ? workInProgress2.memoizedState = renderLanes2 : isHydrating || (renderLanes2 = workInProgress2.type, current = workInProgress2.pendingProps, props = getOwnerDocumentFromRootContainer(
              rootInstanceStackCursor.current
            ).createElement(renderLanes2), props[internalInstanceKey] = workInProgress2, props[internalPropsKey] = current, setInitialProperties(props, renderLanes2, current), markNodeAsHoistable(props), workInProgress2.stateNode = props) : workInProgress2.memoizedState = getResource(
              workInProgress2.type,
              current.memoizedProps,
              workInProgress2.pendingProps,
              current.memoizedState
            ), null;
          case 27:
            return pushHostContext(workInProgress2), null === current && isHydrating && (props = workInProgress2.stateNode = resolveSingletonInstance(
              workInProgress2.type,
              workInProgress2.pendingProps,
              rootInstanceStackCursor.current
            ), hydrationParentFiber = workInProgress2, rootOrSingletonContext = true, $$typeof = nextHydratableInstance, isSingletonScope(workInProgress2.type) ? (previousHydratableOnEnteringScopedSingleton = $$typeof, nextHydratableInstance = getNextHydratable(props.firstChild)) : nextHydratableInstance = $$typeof), reconcileChildren(
              current,
              workInProgress2,
              workInProgress2.pendingProps.children,
              renderLanes2
            ), markRef(current, workInProgress2), null === current && (workInProgress2.flags |= 4194304), workInProgress2.child;
          case 5:
            if (null === current && isHydrating) {
              if ($$typeof = props = nextHydratableInstance)
                props = canHydrateInstance(
                  props,
                  workInProgress2.type,
                  workInProgress2.pendingProps,
                  rootOrSingletonContext
                ), null !== props ? (workInProgress2.stateNode = props, hydrationParentFiber = workInProgress2, nextHydratableInstance = getNextHydratable(props.firstChild), rootOrSingletonContext = false, $$typeof = true) : $$typeof = false;
              $$typeof || throwOnHydrationMismatch(workInProgress2);
            }
            pushHostContext(workInProgress2);
            $$typeof = workInProgress2.type;
            prevState = workInProgress2.pendingProps;
            nextState = null !== current ? current.memoizedProps : null;
            props = prevState.children;
            shouldSetTextContent($$typeof, prevState) ? props = null : null !== nextState && shouldSetTextContent($$typeof, nextState) && (workInProgress2.flags |= 32);
            null !== workInProgress2.memoizedState && ($$typeof = renderWithHooks(
              current,
              workInProgress2,
              TransitionAwareHostComponent,
              null,
              null,
              renderLanes2
            ), HostTransitionContext._currentValue = $$typeof);
            markRef(current, workInProgress2);
            reconcileChildren(current, workInProgress2, props, renderLanes2);
            return workInProgress2.child;
          case 6:
            if (null === current && isHydrating) {
              if (current = renderLanes2 = nextHydratableInstance)
                renderLanes2 = canHydrateTextInstance(
                  renderLanes2,
                  workInProgress2.pendingProps,
                  rootOrSingletonContext
                ), null !== renderLanes2 ? (workInProgress2.stateNode = renderLanes2, hydrationParentFiber = workInProgress2, nextHydratableInstance = null, current = true) : current = false;
              current || throwOnHydrationMismatch(workInProgress2);
            }
            return null;
          case 13:
            return updateSuspenseComponent(current, workInProgress2, renderLanes2);
          case 4:
            return pushHostContainer(
              workInProgress2,
              workInProgress2.stateNode.containerInfo
            ), props = workInProgress2.pendingProps, null === current ? workInProgress2.child = reconcileChildFibers(
              workInProgress2,
              null,
              props,
              renderLanes2
            ) : reconcileChildren(current, workInProgress2, props, renderLanes2), workInProgress2.child;
          case 11:
            return updateForwardRef(
              current,
              workInProgress2,
              workInProgress2.type,
              workInProgress2.pendingProps,
              renderLanes2
            );
          case 7:
            return reconcileChildren(
              current,
              workInProgress2,
              workInProgress2.pendingProps,
              renderLanes2
            ), workInProgress2.child;
          case 8:
            return reconcileChildren(
              current,
              workInProgress2,
              workInProgress2.pendingProps.children,
              renderLanes2
            ), workInProgress2.child;
          case 12:
            return reconcileChildren(
              current,
              workInProgress2,
              workInProgress2.pendingProps.children,
              renderLanes2
            ), workInProgress2.child;
          case 10:
            return props = workInProgress2.pendingProps, pushProvider(workInProgress2, workInProgress2.type, props.value), reconcileChildren(current, workInProgress2, props.children, renderLanes2), workInProgress2.child;
          case 9:
            return $$typeof = workInProgress2.type._context, props = workInProgress2.pendingProps.children, prepareToReadContext(workInProgress2), $$typeof = readContext($$typeof), props = props($$typeof), workInProgress2.flags |= 1, reconcileChildren(current, workInProgress2, props, renderLanes2), workInProgress2.child;
          case 14:
            return updateMemoComponent(
              current,
              workInProgress2,
              workInProgress2.type,
              workInProgress2.pendingProps,
              renderLanes2
            );
          case 15:
            return updateSimpleMemoComponent(
              current,
              workInProgress2,
              workInProgress2.type,
              workInProgress2.pendingProps,
              renderLanes2
            );
          case 19:
            return updateSuspenseListComponent(current, workInProgress2, renderLanes2);
          case 31:
            return updateActivityComponent(current, workInProgress2, renderLanes2);
          case 22:
            return updateOffscreenComponent(
              current,
              workInProgress2,
              renderLanes2,
              workInProgress2.pendingProps
            );
          case 24:
            return prepareToReadContext(workInProgress2), props = readContext(CacheContext), null === current ? ($$typeof = peekCacheFromPool(), null === $$typeof && ($$typeof = workInProgressRoot, prevState = createCache(), $$typeof.pooledCache = prevState, prevState.refCount++, null !== prevState && ($$typeof.pooledCacheLanes |= renderLanes2), $$typeof = prevState), workInProgress2.memoizedState = { parent: props, cache: $$typeof }, initializeUpdateQueue(workInProgress2), pushProvider(workInProgress2, CacheContext, $$typeof)) : (0 !== (current.lanes & renderLanes2) && (cloneUpdateQueue(current, workInProgress2), processUpdateQueue(workInProgress2, null, null, renderLanes2), suspendIfUpdateReadFromEntangledAsyncAction()), $$typeof = current.memoizedState, prevState = workInProgress2.memoizedState, $$typeof.parent !== props ? ($$typeof = { parent: props, cache: props }, workInProgress2.memoizedState = $$typeof, 0 === workInProgress2.lanes && (workInProgress2.memoizedState = workInProgress2.updateQueue.baseState = $$typeof), pushProvider(workInProgress2, CacheContext, props)) : (props = prevState.cache, pushProvider(workInProgress2, CacheContext, props), props !== $$typeof.cache && propagateContextChanges(
              workInProgress2,
              [CacheContext],
              renderLanes2,
              true
            ))), reconcileChildren(
              current,
              workInProgress2,
              workInProgress2.pendingProps.children,
              renderLanes2
            ), workInProgress2.child;
          case 29:
            throw workInProgress2.pendingProps;
        }
        throw Error(formatProdErrorMessage(156, workInProgress2.tag));
      }
      function markUpdate(workInProgress2) {
        workInProgress2.flags |= 4;
      }
      function preloadInstanceAndSuspendIfNeeded(workInProgress2, type, oldProps, newProps, renderLanes2) {
        if (type = 0 !== (workInProgress2.mode & 32)) type = false;
        if (type) {
          if (workInProgress2.flags |= 16777216, (renderLanes2 & 335544128) === renderLanes2)
            if (workInProgress2.stateNode.complete) workInProgress2.flags |= 8192;
            else if (shouldRemainOnPreviousScreen()) workInProgress2.flags |= 8192;
            else
              throw suspendedThenable = noopSuspenseyCommitThenable, SuspenseyCommitException;
        } else workInProgress2.flags &= -16777217;
      }
      function preloadResourceAndSuspendIfNeeded(workInProgress2, resource) {
        if ("stylesheet" !== resource.type || 0 !== (resource.state.loading & 4))
          workInProgress2.flags &= -16777217;
        else if (workInProgress2.flags |= 16777216, !preloadResource(resource))
          if (shouldRemainOnPreviousScreen()) workInProgress2.flags |= 8192;
          else
            throw suspendedThenable = noopSuspenseyCommitThenable, SuspenseyCommitException;
      }
      function scheduleRetryEffect(workInProgress2, retryQueue) {
        null !== retryQueue && (workInProgress2.flags |= 4);
        workInProgress2.flags & 16384 && (retryQueue = 22 !== workInProgress2.tag ? claimNextRetryLane() : 536870912, workInProgress2.lanes |= retryQueue, workInProgressSuspendedRetryLanes |= retryQueue);
      }
      function cutOffTailIfNeeded(renderState, hasRenderedATailFallback) {
        if (!isHydrating)
          switch (renderState.tailMode) {
            case "hidden":
              hasRenderedATailFallback = renderState.tail;
              for (var lastTailNode = null; null !== hasRenderedATailFallback; )
                null !== hasRenderedATailFallback.alternate && (lastTailNode = hasRenderedATailFallback), hasRenderedATailFallback = hasRenderedATailFallback.sibling;
              null === lastTailNode ? renderState.tail = null : lastTailNode.sibling = null;
              break;
            case "collapsed":
              lastTailNode = renderState.tail;
              for (var lastTailNode$106 = null; null !== lastTailNode; )
                null !== lastTailNode.alternate && (lastTailNode$106 = lastTailNode), lastTailNode = lastTailNode.sibling;
              null === lastTailNode$106 ? hasRenderedATailFallback || null === renderState.tail ? renderState.tail = null : renderState.tail.sibling = null : lastTailNode$106.sibling = null;
          }
      }
      function bubbleProperties(completedWork) {
        var didBailout = null !== completedWork.alternate && completedWork.alternate.child === completedWork.child, newChildLanes = 0, subtreeFlags = 0;
        if (didBailout)
          for (var child$107 = completedWork.child; null !== child$107; )
            newChildLanes |= child$107.lanes | child$107.childLanes, subtreeFlags |= child$107.subtreeFlags & 65011712, subtreeFlags |= child$107.flags & 65011712, child$107.return = completedWork, child$107 = child$107.sibling;
        else
          for (child$107 = completedWork.child; null !== child$107; )
            newChildLanes |= child$107.lanes | child$107.childLanes, subtreeFlags |= child$107.subtreeFlags, subtreeFlags |= child$107.flags, child$107.return = completedWork, child$107 = child$107.sibling;
        completedWork.subtreeFlags |= subtreeFlags;
        completedWork.childLanes = newChildLanes;
        return didBailout;
      }
      function completeWork(current, workInProgress2, renderLanes2) {
        var newProps = workInProgress2.pendingProps;
        popTreeContext(workInProgress2);
        switch (workInProgress2.tag) {
          case 16:
          case 15:
          case 0:
          case 11:
          case 7:
          case 8:
          case 12:
          case 9:
          case 14:
            return bubbleProperties(workInProgress2), null;
          case 1:
            return bubbleProperties(workInProgress2), null;
          case 3:
            renderLanes2 = workInProgress2.stateNode;
            newProps = null;
            null !== current && (newProps = current.memoizedState.cache);
            workInProgress2.memoizedState.cache !== newProps && (workInProgress2.flags |= 2048);
            popProvider(CacheContext);
            popHostContainer();
            renderLanes2.pendingContext && (renderLanes2.context = renderLanes2.pendingContext, renderLanes2.pendingContext = null);
            if (null === current || null === current.child)
              popHydrationState(workInProgress2) ? markUpdate(workInProgress2) : null === current || current.memoizedState.isDehydrated && 0 === (workInProgress2.flags & 256) || (workInProgress2.flags |= 1024, upgradeHydrationErrorsToRecoverable());
            bubbleProperties(workInProgress2);
            return null;
          case 26:
            var type = workInProgress2.type, nextResource = workInProgress2.memoizedState;
            null === current ? (markUpdate(workInProgress2), null !== nextResource ? (bubbleProperties(workInProgress2), preloadResourceAndSuspendIfNeeded(workInProgress2, nextResource)) : (bubbleProperties(workInProgress2), preloadInstanceAndSuspendIfNeeded(
              workInProgress2,
              type,
              null,
              newProps,
              renderLanes2
            ))) : nextResource ? nextResource !== current.memoizedState ? (markUpdate(workInProgress2), bubbleProperties(workInProgress2), preloadResourceAndSuspendIfNeeded(workInProgress2, nextResource)) : (bubbleProperties(workInProgress2), workInProgress2.flags &= -16777217) : (current = current.memoizedProps, current !== newProps && markUpdate(workInProgress2), bubbleProperties(workInProgress2), preloadInstanceAndSuspendIfNeeded(
              workInProgress2,
              type,
              current,
              newProps,
              renderLanes2
            ));
            return null;
          case 27:
            popHostContext(workInProgress2);
            renderLanes2 = rootInstanceStackCursor.current;
            type = workInProgress2.type;
            if (null !== current && null != workInProgress2.stateNode)
              current.memoizedProps !== newProps && markUpdate(workInProgress2);
            else {
              if (!newProps) {
                if (null === workInProgress2.stateNode)
                  throw Error(formatProdErrorMessage(166));
                bubbleProperties(workInProgress2);
                return null;
              }
              current = contextStackCursor.current;
              popHydrationState(workInProgress2) ? prepareToHydrateHostInstance(workInProgress2, current) : (current = resolveSingletonInstance(type, newProps, renderLanes2), workInProgress2.stateNode = current, markUpdate(workInProgress2));
            }
            bubbleProperties(workInProgress2);
            return null;
          case 5:
            popHostContext(workInProgress2);
            type = workInProgress2.type;
            if (null !== current && null != workInProgress2.stateNode)
              current.memoizedProps !== newProps && markUpdate(workInProgress2);
            else {
              if (!newProps) {
                if (null === workInProgress2.stateNode)
                  throw Error(formatProdErrorMessage(166));
                bubbleProperties(workInProgress2);
                return null;
              }
              nextResource = contextStackCursor.current;
              if (popHydrationState(workInProgress2))
                prepareToHydrateHostInstance(workInProgress2, nextResource);
              else {
                var ownerDocument = getOwnerDocumentFromRootContainer(
                  rootInstanceStackCursor.current
                );
                switch (nextResource) {
                  case 1:
                    nextResource = ownerDocument.createElementNS(
                      "http://www.w3.org/2000/svg",
                      type
                    );
                    break;
                  case 2:
                    nextResource = ownerDocument.createElementNS(
                      "http://www.w3.org/1998/Math/MathML",
                      type
                    );
                    break;
                  default:
                    switch (type) {
                      case "svg":
                        nextResource = ownerDocument.createElementNS(
                          "http://www.w3.org/2000/svg",
                          type
                        );
                        break;
                      case "math":
                        nextResource = ownerDocument.createElementNS(
                          "http://www.w3.org/1998/Math/MathML",
                          type
                        );
                        break;
                      case "script":
                        nextResource = ownerDocument.createElement("div");
                        nextResource.innerHTML = "<script><\/script>";
                        nextResource = nextResource.removeChild(
                          nextResource.firstChild
                        );
                        break;
                      case "select":
                        nextResource = "string" === typeof newProps.is ? ownerDocument.createElement("select", {
                          is: newProps.is
                        }) : ownerDocument.createElement("select");
                        newProps.multiple ? nextResource.multiple = true : newProps.size && (nextResource.size = newProps.size);
                        break;
                      default:
                        nextResource = "string" === typeof newProps.is ? ownerDocument.createElement(type, { is: newProps.is }) : ownerDocument.createElement(type);
                    }
                }
                nextResource[internalInstanceKey] = workInProgress2;
                nextResource[internalPropsKey] = newProps;
                a: for (ownerDocument = workInProgress2.child; null !== ownerDocument; ) {
                  if (5 === ownerDocument.tag || 6 === ownerDocument.tag)
                    nextResource.appendChild(ownerDocument.stateNode);
                  else if (4 !== ownerDocument.tag && 27 !== ownerDocument.tag && null !== ownerDocument.child) {
                    ownerDocument.child.return = ownerDocument;
                    ownerDocument = ownerDocument.child;
                    continue;
                  }
                  if (ownerDocument === workInProgress2) break a;
                  for (; null === ownerDocument.sibling; ) {
                    if (null === ownerDocument.return || ownerDocument.return === workInProgress2)
                      break a;
                    ownerDocument = ownerDocument.return;
                  }
                  ownerDocument.sibling.return = ownerDocument.return;
                  ownerDocument = ownerDocument.sibling;
                }
                workInProgress2.stateNode = nextResource;
                a: switch (setInitialProperties(nextResource, type, newProps), type) {
                  case "button":
                  case "input":
                  case "select":
                  case "textarea":
                    newProps = !!newProps.autoFocus;
                    break a;
                  case "img":
                    newProps = true;
                    break a;
                  default:
                    newProps = false;
                }
                newProps && markUpdate(workInProgress2);
              }
            }
            bubbleProperties(workInProgress2);
            preloadInstanceAndSuspendIfNeeded(
              workInProgress2,
              workInProgress2.type,
              null === current ? null : current.memoizedProps,
              workInProgress2.pendingProps,
              renderLanes2
            );
            return null;
          case 6:
            if (current && null != workInProgress2.stateNode)
              current.memoizedProps !== newProps && markUpdate(workInProgress2);
            else {
              if ("string" !== typeof newProps && null === workInProgress2.stateNode)
                throw Error(formatProdErrorMessage(166));
              current = rootInstanceStackCursor.current;
              if (popHydrationState(workInProgress2)) {
                current = workInProgress2.stateNode;
                renderLanes2 = workInProgress2.memoizedProps;
                newProps = null;
                type = hydrationParentFiber;
                if (null !== type)
                  switch (type.tag) {
                    case 27:
                    case 5:
                      newProps = type.memoizedProps;
                  }
                current[internalInstanceKey] = workInProgress2;
                current = current.nodeValue === renderLanes2 || null !== newProps && true === newProps.suppressHydrationWarning || checkForUnmatchedText(current.nodeValue, renderLanes2) ? true : false;
                current || throwOnHydrationMismatch(workInProgress2, true);
              } else
                current = getOwnerDocumentFromRootContainer(current).createTextNode(
                  newProps
                ), current[internalInstanceKey] = workInProgress2, workInProgress2.stateNode = current;
            }
            bubbleProperties(workInProgress2);
            return null;
          case 31:
            renderLanes2 = workInProgress2.memoizedState;
            if (null === current || null !== current.memoizedState) {
              newProps = popHydrationState(workInProgress2);
              if (null !== renderLanes2) {
                if (null === current) {
                  if (!newProps) throw Error(formatProdErrorMessage(318));
                  current = workInProgress2.memoizedState;
                  current = null !== current ? current.dehydrated : null;
                  if (!current) throw Error(formatProdErrorMessage(557));
                  current[internalInstanceKey] = workInProgress2;
                } else
                  resetHydrationState(), 0 === (workInProgress2.flags & 128) && (workInProgress2.memoizedState = null), workInProgress2.flags |= 4;
                bubbleProperties(workInProgress2);
                current = false;
              } else
                renderLanes2 = upgradeHydrationErrorsToRecoverable(), null !== current && null !== current.memoizedState && (current.memoizedState.hydrationErrors = renderLanes2), current = true;
              if (!current) {
                if (workInProgress2.flags & 256)
                  return popSuspenseHandler(workInProgress2), workInProgress2;
                popSuspenseHandler(workInProgress2);
                return null;
              }
              if (0 !== (workInProgress2.flags & 128))
                throw Error(formatProdErrorMessage(558));
            }
            bubbleProperties(workInProgress2);
            return null;
          case 13:
            newProps = workInProgress2.memoizedState;
            if (null === current || null !== current.memoizedState && null !== current.memoizedState.dehydrated) {
              type = popHydrationState(workInProgress2);
              if (null !== newProps && null !== newProps.dehydrated) {
                if (null === current) {
                  if (!type) throw Error(formatProdErrorMessage(318));
                  type = workInProgress2.memoizedState;
                  type = null !== type ? type.dehydrated : null;
                  if (!type) throw Error(formatProdErrorMessage(317));
                  type[internalInstanceKey] = workInProgress2;
                } else
                  resetHydrationState(), 0 === (workInProgress2.flags & 128) && (workInProgress2.memoizedState = null), workInProgress2.flags |= 4;
                bubbleProperties(workInProgress2);
                type = false;
              } else
                type = upgradeHydrationErrorsToRecoverable(), null !== current && null !== current.memoizedState && (current.memoizedState.hydrationErrors = type), type = true;
              if (!type) {
                if (workInProgress2.flags & 256)
                  return popSuspenseHandler(workInProgress2), workInProgress2;
                popSuspenseHandler(workInProgress2);
                return null;
              }
            }
            popSuspenseHandler(workInProgress2);
            if (0 !== (workInProgress2.flags & 128))
              return workInProgress2.lanes = renderLanes2, workInProgress2;
            renderLanes2 = null !== newProps;
            current = null !== current && null !== current.memoizedState;
            renderLanes2 && (newProps = workInProgress2.child, type = null, null !== newProps.alternate && null !== newProps.alternate.memoizedState && null !== newProps.alternate.memoizedState.cachePool && (type = newProps.alternate.memoizedState.cachePool.pool), nextResource = null, null !== newProps.memoizedState && null !== newProps.memoizedState.cachePool && (nextResource = newProps.memoizedState.cachePool.pool), nextResource !== type && (newProps.flags |= 2048));
            renderLanes2 !== current && renderLanes2 && (workInProgress2.child.flags |= 8192);
            scheduleRetryEffect(workInProgress2, workInProgress2.updateQueue);
            bubbleProperties(workInProgress2);
            return null;
          case 4:
            return popHostContainer(), null === current && listenToAllSupportedEvents(workInProgress2.stateNode.containerInfo), bubbleProperties(workInProgress2), null;
          case 10:
            return popProvider(workInProgress2.type), bubbleProperties(workInProgress2), null;
          case 19:
            pop(suspenseStackCursor);
            newProps = workInProgress2.memoizedState;
            if (null === newProps) return bubbleProperties(workInProgress2), null;
            type = 0 !== (workInProgress2.flags & 128);
            nextResource = newProps.rendering;
            if (null === nextResource)
              if (type) cutOffTailIfNeeded(newProps, false);
              else {
                if (0 !== workInProgressRootExitStatus || null !== current && 0 !== (current.flags & 128))
                  for (current = workInProgress2.child; null !== current; ) {
                    nextResource = findFirstSuspended(current);
                    if (null !== nextResource) {
                      workInProgress2.flags |= 128;
                      cutOffTailIfNeeded(newProps, false);
                      current = nextResource.updateQueue;
                      workInProgress2.updateQueue = current;
                      scheduleRetryEffect(workInProgress2, current);
                      workInProgress2.subtreeFlags = 0;
                      current = renderLanes2;
                      for (renderLanes2 = workInProgress2.child; null !== renderLanes2; )
                        resetWorkInProgress(renderLanes2, current), renderLanes2 = renderLanes2.sibling;
                      push(
                        suspenseStackCursor,
                        suspenseStackCursor.current & 1 | 2
                      );
                      isHydrating && pushTreeFork(workInProgress2, newProps.treeForkCount);
                      return workInProgress2.child;
                    }
                    current = current.sibling;
                  }
                null !== newProps.tail && now() > workInProgressRootRenderTargetTime && (workInProgress2.flags |= 128, type = true, cutOffTailIfNeeded(newProps, false), workInProgress2.lanes = 4194304);
              }
            else {
              if (!type)
                if (current = findFirstSuspended(nextResource), null !== current) {
                  if (workInProgress2.flags |= 128, type = true, current = current.updateQueue, workInProgress2.updateQueue = current, scheduleRetryEffect(workInProgress2, current), cutOffTailIfNeeded(newProps, true), null === newProps.tail && "hidden" === newProps.tailMode && !nextResource.alternate && !isHydrating)
                    return bubbleProperties(workInProgress2), null;
                } else
                  2 * now() - newProps.renderingStartTime > workInProgressRootRenderTargetTime && 536870912 !== renderLanes2 && (workInProgress2.flags |= 128, type = true, cutOffTailIfNeeded(newProps, false), workInProgress2.lanes = 4194304);
              newProps.isBackwards ? (nextResource.sibling = workInProgress2.child, workInProgress2.child = nextResource) : (current = newProps.last, null !== current ? current.sibling = nextResource : workInProgress2.child = nextResource, newProps.last = nextResource);
            }
            if (null !== newProps.tail)
              return current = newProps.tail, newProps.rendering = current, newProps.tail = current.sibling, newProps.renderingStartTime = now(), current.sibling = null, renderLanes2 = suspenseStackCursor.current, push(
                suspenseStackCursor,
                type ? renderLanes2 & 1 | 2 : renderLanes2 & 1
              ), isHydrating && pushTreeFork(workInProgress2, newProps.treeForkCount), current;
            bubbleProperties(workInProgress2);
            return null;
          case 22:
          case 23:
            return popSuspenseHandler(workInProgress2), popHiddenContext(), newProps = null !== workInProgress2.memoizedState, null !== current ? null !== current.memoizedState !== newProps && (workInProgress2.flags |= 8192) : newProps && (workInProgress2.flags |= 8192), newProps ? 0 !== (renderLanes2 & 536870912) && 0 === (workInProgress2.flags & 128) && (bubbleProperties(workInProgress2), workInProgress2.subtreeFlags & 6 && (workInProgress2.flags |= 8192)) : bubbleProperties(workInProgress2), renderLanes2 = workInProgress2.updateQueue, null !== renderLanes2 && scheduleRetryEffect(workInProgress2, renderLanes2.retryQueue), renderLanes2 = null, null !== current && null !== current.memoizedState && null !== current.memoizedState.cachePool && (renderLanes2 = current.memoizedState.cachePool.pool), newProps = null, null !== workInProgress2.memoizedState && null !== workInProgress2.memoizedState.cachePool && (newProps = workInProgress2.memoizedState.cachePool.pool), newProps !== renderLanes2 && (workInProgress2.flags |= 2048), null !== current && pop(resumedCache), null;
          case 24:
            return renderLanes2 = null, null !== current && (renderLanes2 = current.memoizedState.cache), workInProgress2.memoizedState.cache !== renderLanes2 && (workInProgress2.flags |= 2048), popProvider(CacheContext), bubbleProperties(workInProgress2), null;
          case 25:
            return null;
          case 30:
            return null;
        }
        throw Error(formatProdErrorMessage(156, workInProgress2.tag));
      }
      function unwindWork(current, workInProgress2) {
        popTreeContext(workInProgress2);
        switch (workInProgress2.tag) {
          case 1:
            return current = workInProgress2.flags, current & 65536 ? (workInProgress2.flags = current & -65537 | 128, workInProgress2) : null;
          case 3:
            return popProvider(CacheContext), popHostContainer(), current = workInProgress2.flags, 0 !== (current & 65536) && 0 === (current & 128) ? (workInProgress2.flags = current & -65537 | 128, workInProgress2) : null;
          case 26:
          case 27:
          case 5:
            return popHostContext(workInProgress2), null;
          case 31:
            if (null !== workInProgress2.memoizedState) {
              popSuspenseHandler(workInProgress2);
              if (null === workInProgress2.alternate)
                throw Error(formatProdErrorMessage(340));
              resetHydrationState();
            }
            current = workInProgress2.flags;
            return current & 65536 ? (workInProgress2.flags = current & -65537 | 128, workInProgress2) : null;
          case 13:
            popSuspenseHandler(workInProgress2);
            current = workInProgress2.memoizedState;
            if (null !== current && null !== current.dehydrated) {
              if (null === workInProgress2.alternate)
                throw Error(formatProdErrorMessage(340));
              resetHydrationState();
            }
            current = workInProgress2.flags;
            return current & 65536 ? (workInProgress2.flags = current & -65537 | 128, workInProgress2) : null;
          case 19:
            return pop(suspenseStackCursor), null;
          case 4:
            return popHostContainer(), null;
          case 10:
            return popProvider(workInProgress2.type), null;
          case 22:
          case 23:
            return popSuspenseHandler(workInProgress2), popHiddenContext(), null !== current && pop(resumedCache), current = workInProgress2.flags, current & 65536 ? (workInProgress2.flags = current & -65537 | 128, workInProgress2) : null;
          case 24:
            return popProvider(CacheContext), null;
          case 25:
            return null;
          default:
            return null;
        }
      }
      function unwindInterruptedWork(current, interruptedWork) {
        popTreeContext(interruptedWork);
        switch (interruptedWork.tag) {
          case 3:
            popProvider(CacheContext);
            popHostContainer();
            break;
          case 26:
          case 27:
          case 5:
            popHostContext(interruptedWork);
            break;
          case 4:
            popHostContainer();
            break;
          case 31:
            null !== interruptedWork.memoizedState && popSuspenseHandler(interruptedWork);
            break;
          case 13:
            popSuspenseHandler(interruptedWork);
            break;
          case 19:
            pop(suspenseStackCursor);
            break;
          case 10:
            popProvider(interruptedWork.type);
            break;
          case 22:
          case 23:
            popSuspenseHandler(interruptedWork);
            popHiddenContext();
            null !== current && pop(resumedCache);
            break;
          case 24:
            popProvider(CacheContext);
        }
      }
      function commitHookEffectListMount(flags, finishedWork) {
        try {
          var updateQueue = finishedWork.updateQueue, lastEffect = null !== updateQueue ? updateQueue.lastEffect : null;
          if (null !== lastEffect) {
            var firstEffect = lastEffect.next;
            updateQueue = firstEffect;
            do {
              if ((updateQueue.tag & flags) === flags) {
                lastEffect = void 0;
                var create = updateQueue.create, inst = updateQueue.inst;
                lastEffect = create();
                inst.destroy = lastEffect;
              }
              updateQueue = updateQueue.next;
            } while (updateQueue !== firstEffect);
          }
        } catch (error) {
          captureCommitPhaseError(finishedWork, finishedWork.return, error);
        }
      }
      function commitHookEffectListUnmount(flags, finishedWork, nearestMountedAncestor$jscomp$0) {
        try {
          var updateQueue = finishedWork.updateQueue, lastEffect = null !== updateQueue ? updateQueue.lastEffect : null;
          if (null !== lastEffect) {
            var firstEffect = lastEffect.next;
            updateQueue = firstEffect;
            do {
              if ((updateQueue.tag & flags) === flags) {
                var inst = updateQueue.inst, destroy = inst.destroy;
                if (void 0 !== destroy) {
                  inst.destroy = void 0;
                  lastEffect = finishedWork;
                  var nearestMountedAncestor = nearestMountedAncestor$jscomp$0, destroy_ = destroy;
                  try {
                    destroy_();
                  } catch (error) {
                    captureCommitPhaseError(
                      lastEffect,
                      nearestMountedAncestor,
                      error
                    );
                  }
                }
              }
              updateQueue = updateQueue.next;
            } while (updateQueue !== firstEffect);
          }
        } catch (error) {
          captureCommitPhaseError(finishedWork, finishedWork.return, error);
        }
      }
      function commitClassCallbacks(finishedWork) {
        var updateQueue = finishedWork.updateQueue;
        if (null !== updateQueue) {
          var instance = finishedWork.stateNode;
          try {
            commitCallbacks(updateQueue, instance);
          } catch (error) {
            captureCommitPhaseError(finishedWork, finishedWork.return, error);
          }
        }
      }
      function safelyCallComponentWillUnmount(current, nearestMountedAncestor, instance) {
        instance.props = resolveClassComponentProps(
          current.type,
          current.memoizedProps
        );
        instance.state = current.memoizedState;
        try {
          instance.componentWillUnmount();
        } catch (error) {
          captureCommitPhaseError(current, nearestMountedAncestor, error);
        }
      }
      function safelyAttachRef(current, nearestMountedAncestor) {
        try {
          var ref = current.ref;
          if (null !== ref) {
            switch (current.tag) {
              case 26:
              case 27:
              case 5:
                var instanceToUse = current.stateNode;
                break;
              case 30:
                instanceToUse = current.stateNode;
                break;
              default:
                instanceToUse = current.stateNode;
            }
            "function" === typeof ref ? current.refCleanup = ref(instanceToUse) : ref.current = instanceToUse;
          }
        } catch (error) {
          captureCommitPhaseError(current, nearestMountedAncestor, error);
        }
      }
      function safelyDetachRef(current, nearestMountedAncestor) {
        var ref = current.ref, refCleanup = current.refCleanup;
        if (null !== ref)
          if ("function" === typeof refCleanup)
            try {
              refCleanup();
            } catch (error) {
              captureCommitPhaseError(current, nearestMountedAncestor, error);
            } finally {
              current.refCleanup = null, current = current.alternate, null != current && (current.refCleanup = null);
            }
          else if ("function" === typeof ref)
            try {
              ref(null);
            } catch (error$140) {
              captureCommitPhaseError(current, nearestMountedAncestor, error$140);
            }
          else ref.current = null;
      }
      function commitHostMount(finishedWork) {
        var type = finishedWork.type, props = finishedWork.memoizedProps, instance = finishedWork.stateNode;
        try {
          a: switch (type) {
            case "button":
            case "input":
            case "select":
            case "textarea":
              props.autoFocus && instance.focus();
              break a;
            case "img":
              props.src ? instance.src = props.src : props.srcSet && (instance.srcset = props.srcSet);
          }
        } catch (error) {
          captureCommitPhaseError(finishedWork, finishedWork.return, error);
        }
      }
      function commitHostUpdate(finishedWork, newProps, oldProps) {
        try {
          var domElement = finishedWork.stateNode;
          updateProperties(domElement, finishedWork.type, oldProps, newProps);
          domElement[internalPropsKey] = newProps;
        } catch (error) {
          captureCommitPhaseError(finishedWork, finishedWork.return, error);
        }
      }
      function isHostParent(fiber) {
        return 5 === fiber.tag || 3 === fiber.tag || 26 === fiber.tag || 27 === fiber.tag && isSingletonScope(fiber.type) || 4 === fiber.tag;
      }
      function getHostSibling(fiber) {
        a: for (; ; ) {
          for (; null === fiber.sibling; ) {
            if (null === fiber.return || isHostParent(fiber.return)) return null;
            fiber = fiber.return;
          }
          fiber.sibling.return = fiber.return;
          for (fiber = fiber.sibling; 5 !== fiber.tag && 6 !== fiber.tag && 18 !== fiber.tag; ) {
            if (27 === fiber.tag && isSingletonScope(fiber.type)) continue a;
            if (fiber.flags & 2) continue a;
            if (null === fiber.child || 4 === fiber.tag) continue a;
            else fiber.child.return = fiber, fiber = fiber.child;
          }
          if (!(fiber.flags & 2)) return fiber.stateNode;
        }
      }
      function insertOrAppendPlacementNodeIntoContainer(node, before, parent) {
        var tag = node.tag;
        if (5 === tag || 6 === tag)
          node = node.stateNode, before ? (9 === parent.nodeType ? parent.body : "HTML" === parent.nodeName ? parent.ownerDocument.body : parent).insertBefore(node, before) : (before = 9 === parent.nodeType ? parent.body : "HTML" === parent.nodeName ? parent.ownerDocument.body : parent, before.appendChild(node), parent = parent._reactRootContainer, null !== parent && void 0 !== parent || null !== before.onclick || (before.onclick = noop$1));
        else if (4 !== tag && (27 === tag && isSingletonScope(node.type) && (parent = node.stateNode, before = null), node = node.child, null !== node))
          for (insertOrAppendPlacementNodeIntoContainer(node, before, parent), node = node.sibling; null !== node; )
            insertOrAppendPlacementNodeIntoContainer(node, before, parent), node = node.sibling;
      }
      function insertOrAppendPlacementNode(node, before, parent) {
        var tag = node.tag;
        if (5 === tag || 6 === tag)
          node = node.stateNode, before ? parent.insertBefore(node, before) : parent.appendChild(node);
        else if (4 !== tag && (27 === tag && isSingletonScope(node.type) && (parent = node.stateNode), node = node.child, null !== node))
          for (insertOrAppendPlacementNode(node, before, parent), node = node.sibling; null !== node; )
            insertOrAppendPlacementNode(node, before, parent), node = node.sibling;
      }
      function commitHostSingletonAcquisition(finishedWork) {
        var singleton = finishedWork.stateNode, props = finishedWork.memoizedProps;
        try {
          for (var type = finishedWork.type, attributes = singleton.attributes; attributes.length; )
            singleton.removeAttributeNode(attributes[0]);
          setInitialProperties(singleton, type, props);
          singleton[internalInstanceKey] = finishedWork;
          singleton[internalPropsKey] = props;
        } catch (error) {
          captureCommitPhaseError(finishedWork, finishedWork.return, error);
        }
      }
      var offscreenSubtreeIsHidden = false;
      var offscreenSubtreeWasHidden = false;
      var needsFormReset = false;
      var PossiblyWeakSet = "function" === typeof WeakSet ? WeakSet : Set;
      var nextEffect = null;
      function commitBeforeMutationEffects(root2, firstChild) {
        root2 = root2.containerInfo;
        eventsEnabled = _enabled;
        root2 = getActiveElementDeep(root2);
        if (hasSelectionCapabilities(root2)) {
          if ("selectionStart" in root2)
            var JSCompiler_temp = {
              start: root2.selectionStart,
              end: root2.selectionEnd
            };
          else
            a: {
              JSCompiler_temp = (JSCompiler_temp = root2.ownerDocument) && JSCompiler_temp.defaultView || window;
              var selection = JSCompiler_temp.getSelection && JSCompiler_temp.getSelection();
              if (selection && 0 !== selection.rangeCount) {
                JSCompiler_temp = selection.anchorNode;
                var anchorOffset = selection.anchorOffset, focusNode = selection.focusNode;
                selection = selection.focusOffset;
                try {
                  JSCompiler_temp.nodeType, focusNode.nodeType;
                } catch (e$20) {
                  JSCompiler_temp = null;
                  break a;
                }
                var length = 0, start = -1, end = -1, indexWithinAnchor = 0, indexWithinFocus = 0, node = root2, parentNode = null;
                b: for (; ; ) {
                  for (var next; ; ) {
                    node !== JSCompiler_temp || 0 !== anchorOffset && 3 !== node.nodeType || (start = length + anchorOffset);
                    node !== focusNode || 0 !== selection && 3 !== node.nodeType || (end = length + selection);
                    3 === node.nodeType && (length += node.nodeValue.length);
                    if (null === (next = node.firstChild)) break;
                    parentNode = node;
                    node = next;
                  }
                  for (; ; ) {
                    if (node === root2) break b;
                    parentNode === JSCompiler_temp && ++indexWithinAnchor === anchorOffset && (start = length);
                    parentNode === focusNode && ++indexWithinFocus === selection && (end = length);
                    if (null !== (next = node.nextSibling)) break;
                    node = parentNode;
                    parentNode = node.parentNode;
                  }
                  node = next;
                }
                JSCompiler_temp = -1 === start || -1 === end ? null : { start, end };
              } else JSCompiler_temp = null;
            }
          JSCompiler_temp = JSCompiler_temp || { start: 0, end: 0 };
        } else JSCompiler_temp = null;
        selectionInformation = { focusedElem: root2, selectionRange: JSCompiler_temp };
        _enabled = false;
        for (nextEffect = firstChild; null !== nextEffect; )
          if (firstChild = nextEffect, root2 = firstChild.child, 0 !== (firstChild.subtreeFlags & 1028) && null !== root2)
            root2.return = firstChild, nextEffect = root2;
          else
            for (; null !== nextEffect; ) {
              firstChild = nextEffect;
              focusNode = firstChild.alternate;
              root2 = firstChild.flags;
              switch (firstChild.tag) {
                case 0:
                  if (0 !== (root2 & 4) && (root2 = firstChild.updateQueue, root2 = null !== root2 ? root2.events : null, null !== root2))
                    for (JSCompiler_temp = 0; JSCompiler_temp < root2.length; JSCompiler_temp++)
                      anchorOffset = root2[JSCompiler_temp], anchorOffset.ref.impl = anchorOffset.nextImpl;
                  break;
                case 11:
                case 15:
                  break;
                case 1:
                  if (0 !== (root2 & 1024) && null !== focusNode) {
                    root2 = void 0;
                    JSCompiler_temp = firstChild;
                    anchorOffset = focusNode.memoizedProps;
                    focusNode = focusNode.memoizedState;
                    selection = JSCompiler_temp.stateNode;
                    try {
                      var resolvedPrevProps = resolveClassComponentProps(
                        JSCompiler_temp.type,
                        anchorOffset
                      );
                      root2 = selection.getSnapshotBeforeUpdate(
                        resolvedPrevProps,
                        focusNode
                      );
                      selection.__reactInternalSnapshotBeforeUpdate = root2;
                    } catch (error) {
                      captureCommitPhaseError(
                        JSCompiler_temp,
                        JSCompiler_temp.return,
                        error
                      );
                    }
                  }
                  break;
                case 3:
                  if (0 !== (root2 & 1024)) {
                    if (root2 = firstChild.stateNode.containerInfo, JSCompiler_temp = root2.nodeType, 9 === JSCompiler_temp)
                      clearContainerSparingly(root2);
                    else if (1 === JSCompiler_temp)
                      switch (root2.nodeName) {
                        case "HEAD":
                        case "HTML":
                        case "BODY":
                          clearContainerSparingly(root2);
                          break;
                        default:
                          root2.textContent = "";
                      }
                  }
                  break;
                case 5:
                case 26:
                case 27:
                case 6:
                case 4:
                case 17:
                  break;
                default:
                  if (0 !== (root2 & 1024)) throw Error(formatProdErrorMessage(163));
              }
              root2 = firstChild.sibling;
              if (null !== root2) {
                root2.return = firstChild.return;
                nextEffect = root2;
                break;
              }
              nextEffect = firstChild.return;
            }
      }
      function commitLayoutEffectOnFiber(finishedRoot, current, finishedWork) {
        var flags = finishedWork.flags;
        switch (finishedWork.tag) {
          case 0:
          case 11:
          case 15:
            recursivelyTraverseLayoutEffects(finishedRoot, finishedWork);
            flags & 4 && commitHookEffectListMount(5, finishedWork);
            break;
          case 1:
            recursivelyTraverseLayoutEffects(finishedRoot, finishedWork);
            if (flags & 4)
              if (finishedRoot = finishedWork.stateNode, null === current)
                try {
                  finishedRoot.componentDidMount();
                } catch (error) {
                  captureCommitPhaseError(finishedWork, finishedWork.return, error);
                }
              else {
                var prevProps = resolveClassComponentProps(
                  finishedWork.type,
                  current.memoizedProps
                );
                current = current.memoizedState;
                try {
                  finishedRoot.componentDidUpdate(
                    prevProps,
                    current,
                    finishedRoot.__reactInternalSnapshotBeforeUpdate
                  );
                } catch (error$139) {
                  captureCommitPhaseError(
                    finishedWork,
                    finishedWork.return,
                    error$139
                  );
                }
              }
            flags & 64 && commitClassCallbacks(finishedWork);
            flags & 512 && safelyAttachRef(finishedWork, finishedWork.return);
            break;
          case 3:
            recursivelyTraverseLayoutEffects(finishedRoot, finishedWork);
            if (flags & 64 && (finishedRoot = finishedWork.updateQueue, null !== finishedRoot)) {
              current = null;
              if (null !== finishedWork.child)
                switch (finishedWork.child.tag) {
                  case 27:
                  case 5:
                    current = finishedWork.child.stateNode;
                    break;
                  case 1:
                    current = finishedWork.child.stateNode;
                }
              try {
                commitCallbacks(finishedRoot, current);
              } catch (error) {
                captureCommitPhaseError(finishedWork, finishedWork.return, error);
              }
            }
            break;
          case 27:
            null === current && flags & 4 && commitHostSingletonAcquisition(finishedWork);
          case 26:
          case 5:
            recursivelyTraverseLayoutEffects(finishedRoot, finishedWork);
            null === current && flags & 4 && commitHostMount(finishedWork);
            flags & 512 && safelyAttachRef(finishedWork, finishedWork.return);
            break;
          case 12:
            recursivelyTraverseLayoutEffects(finishedRoot, finishedWork);
            break;
          case 31:
            recursivelyTraverseLayoutEffects(finishedRoot, finishedWork);
            flags & 4 && commitActivityHydrationCallbacks(finishedRoot, finishedWork);
            break;
          case 13:
            recursivelyTraverseLayoutEffects(finishedRoot, finishedWork);
            flags & 4 && commitSuspenseHydrationCallbacks(finishedRoot, finishedWork);
            flags & 64 && (finishedRoot = finishedWork.memoizedState, null !== finishedRoot && (finishedRoot = finishedRoot.dehydrated, null !== finishedRoot && (finishedWork = retryDehydratedSuspenseBoundary.bind(
              null,
              finishedWork
            ), registerSuspenseInstanceRetry(finishedRoot, finishedWork))));
            break;
          case 22:
            flags = null !== finishedWork.memoizedState || offscreenSubtreeIsHidden;
            if (!flags) {
              current = null !== current && null !== current.memoizedState || offscreenSubtreeWasHidden;
              prevProps = offscreenSubtreeIsHidden;
              var prevOffscreenSubtreeWasHidden = offscreenSubtreeWasHidden;
              offscreenSubtreeIsHidden = flags;
              (offscreenSubtreeWasHidden = current) && !prevOffscreenSubtreeWasHidden ? recursivelyTraverseReappearLayoutEffects(
                finishedRoot,
                finishedWork,
                0 !== (finishedWork.subtreeFlags & 8772)
              ) : recursivelyTraverseLayoutEffects(finishedRoot, finishedWork);
              offscreenSubtreeIsHidden = prevProps;
              offscreenSubtreeWasHidden = prevOffscreenSubtreeWasHidden;
            }
            break;
          case 30:
            break;
          default:
            recursivelyTraverseLayoutEffects(finishedRoot, finishedWork);
        }
      }
      function detachFiberAfterEffects(fiber) {
        var alternate = fiber.alternate;
        null !== alternate && (fiber.alternate = null, detachFiberAfterEffects(alternate));
        fiber.child = null;
        fiber.deletions = null;
        fiber.sibling = null;
        5 === fiber.tag && (alternate = fiber.stateNode, null !== alternate && detachDeletedInstance(alternate));
        fiber.stateNode = null;
        fiber.return = null;
        fiber.dependencies = null;
        fiber.memoizedProps = null;
        fiber.memoizedState = null;
        fiber.pendingProps = null;
        fiber.stateNode = null;
        fiber.updateQueue = null;
      }
      var hostParent = null;
      var hostParentIsContainer = false;
      function recursivelyTraverseDeletionEffects(finishedRoot, nearestMountedAncestor, parent) {
        for (parent = parent.child; null !== parent; )
          commitDeletionEffectsOnFiber(finishedRoot, nearestMountedAncestor, parent), parent = parent.sibling;
      }
      function commitDeletionEffectsOnFiber(finishedRoot, nearestMountedAncestor, deletedFiber) {
        if (injectedHook && "function" === typeof injectedHook.onCommitFiberUnmount)
          try {
            injectedHook.onCommitFiberUnmount(rendererID, deletedFiber);
          } catch (err) {
          }
        switch (deletedFiber.tag) {
          case 26:
            offscreenSubtreeWasHidden || safelyDetachRef(deletedFiber, nearestMountedAncestor);
            recursivelyTraverseDeletionEffects(
              finishedRoot,
              nearestMountedAncestor,
              deletedFiber
            );
            deletedFiber.memoizedState ? deletedFiber.memoizedState.count-- : deletedFiber.stateNode && (deletedFiber = deletedFiber.stateNode, deletedFiber.parentNode.removeChild(deletedFiber));
            break;
          case 27:
            offscreenSubtreeWasHidden || safelyDetachRef(deletedFiber, nearestMountedAncestor);
            var prevHostParent = hostParent, prevHostParentIsContainer = hostParentIsContainer;
            isSingletonScope(deletedFiber.type) && (hostParent = deletedFiber.stateNode, hostParentIsContainer = false);
            recursivelyTraverseDeletionEffects(
              finishedRoot,
              nearestMountedAncestor,
              deletedFiber
            );
            releaseSingletonInstance(deletedFiber.stateNode);
            hostParent = prevHostParent;
            hostParentIsContainer = prevHostParentIsContainer;
            break;
          case 5:
            offscreenSubtreeWasHidden || safelyDetachRef(deletedFiber, nearestMountedAncestor);
          case 6:
            prevHostParent = hostParent;
            prevHostParentIsContainer = hostParentIsContainer;
            hostParent = null;
            recursivelyTraverseDeletionEffects(
              finishedRoot,
              nearestMountedAncestor,
              deletedFiber
            );
            hostParent = prevHostParent;
            hostParentIsContainer = prevHostParentIsContainer;
            if (null !== hostParent)
              if (hostParentIsContainer)
                try {
                  (9 === hostParent.nodeType ? hostParent.body : "HTML" === hostParent.nodeName ? hostParent.ownerDocument.body : hostParent).removeChild(deletedFiber.stateNode);
                } catch (error) {
                  captureCommitPhaseError(
                    deletedFiber,
                    nearestMountedAncestor,
                    error
                  );
                }
              else
                try {
                  hostParent.removeChild(deletedFiber.stateNode);
                } catch (error) {
                  captureCommitPhaseError(
                    deletedFiber,
                    nearestMountedAncestor,
                    error
                  );
                }
            break;
          case 18:
            null !== hostParent && (hostParentIsContainer ? (finishedRoot = hostParent, clearHydrationBoundary(
              9 === finishedRoot.nodeType ? finishedRoot.body : "HTML" === finishedRoot.nodeName ? finishedRoot.ownerDocument.body : finishedRoot,
              deletedFiber.stateNode
            ), retryIfBlockedOn(finishedRoot)) : clearHydrationBoundary(hostParent, deletedFiber.stateNode));
            break;
          case 4:
            prevHostParent = hostParent;
            prevHostParentIsContainer = hostParentIsContainer;
            hostParent = deletedFiber.stateNode.containerInfo;
            hostParentIsContainer = true;
            recursivelyTraverseDeletionEffects(
              finishedRoot,
              nearestMountedAncestor,
              deletedFiber
            );
            hostParent = prevHostParent;
            hostParentIsContainer = prevHostParentIsContainer;
            break;
          case 0:
          case 11:
          case 14:
          case 15:
            commitHookEffectListUnmount(2, deletedFiber, nearestMountedAncestor);
            offscreenSubtreeWasHidden || commitHookEffectListUnmount(4, deletedFiber, nearestMountedAncestor);
            recursivelyTraverseDeletionEffects(
              finishedRoot,
              nearestMountedAncestor,
              deletedFiber
            );
            break;
          case 1:
            offscreenSubtreeWasHidden || (safelyDetachRef(deletedFiber, nearestMountedAncestor), prevHostParent = deletedFiber.stateNode, "function" === typeof prevHostParent.componentWillUnmount && safelyCallComponentWillUnmount(
              deletedFiber,
              nearestMountedAncestor,
              prevHostParent
            ));
            recursivelyTraverseDeletionEffects(
              finishedRoot,
              nearestMountedAncestor,
              deletedFiber
            );
            break;
          case 21:
            recursivelyTraverseDeletionEffects(
              finishedRoot,
              nearestMountedAncestor,
              deletedFiber
            );
            break;
          case 22:
            offscreenSubtreeWasHidden = (prevHostParent = offscreenSubtreeWasHidden) || null !== deletedFiber.memoizedState;
            recursivelyTraverseDeletionEffects(
              finishedRoot,
              nearestMountedAncestor,
              deletedFiber
            );
            offscreenSubtreeWasHidden = prevHostParent;
            break;
          default:
            recursivelyTraverseDeletionEffects(
              finishedRoot,
              nearestMountedAncestor,
              deletedFiber
            );
        }
      }
      function commitActivityHydrationCallbacks(finishedRoot, finishedWork) {
        if (null === finishedWork.memoizedState && (finishedRoot = finishedWork.alternate, null !== finishedRoot && (finishedRoot = finishedRoot.memoizedState, null !== finishedRoot))) {
          finishedRoot = finishedRoot.dehydrated;
          try {
            retryIfBlockedOn(finishedRoot);
          } catch (error) {
            captureCommitPhaseError(finishedWork, finishedWork.return, error);
          }
        }
      }
      function commitSuspenseHydrationCallbacks(finishedRoot, finishedWork) {
        if (null === finishedWork.memoizedState && (finishedRoot = finishedWork.alternate, null !== finishedRoot && (finishedRoot = finishedRoot.memoizedState, null !== finishedRoot && (finishedRoot = finishedRoot.dehydrated, null !== finishedRoot))))
          try {
            retryIfBlockedOn(finishedRoot);
          } catch (error) {
            captureCommitPhaseError(finishedWork, finishedWork.return, error);
          }
      }
      function getRetryCache(finishedWork) {
        switch (finishedWork.tag) {
          case 31:
          case 13:
          case 19:
            var retryCache = finishedWork.stateNode;
            null === retryCache && (retryCache = finishedWork.stateNode = new PossiblyWeakSet());
            return retryCache;
          case 22:
            return finishedWork = finishedWork.stateNode, retryCache = finishedWork._retryCache, null === retryCache && (retryCache = finishedWork._retryCache = new PossiblyWeakSet()), retryCache;
          default:
            throw Error(formatProdErrorMessage(435, finishedWork.tag));
        }
      }
      function attachSuspenseRetryListeners(finishedWork, wakeables) {
        var retryCache = getRetryCache(finishedWork);
        wakeables.forEach(function(wakeable) {
          if (!retryCache.has(wakeable)) {
            retryCache.add(wakeable);
            var retry = resolveRetryWakeable.bind(null, finishedWork, wakeable);
            wakeable.then(retry, retry);
          }
        });
      }
      function recursivelyTraverseMutationEffects(root$jscomp$0, parentFiber) {
        var deletions = parentFiber.deletions;
        if (null !== deletions)
          for (var i = 0; i < deletions.length; i++) {
            var childToDelete = deletions[i], root2 = root$jscomp$0, returnFiber = parentFiber, parent = returnFiber;
            a: for (; null !== parent; ) {
              switch (parent.tag) {
                case 27:
                  if (isSingletonScope(parent.type)) {
                    hostParent = parent.stateNode;
                    hostParentIsContainer = false;
                    break a;
                  }
                  break;
                case 5:
                  hostParent = parent.stateNode;
                  hostParentIsContainer = false;
                  break a;
                case 3:
                case 4:
                  hostParent = parent.stateNode.containerInfo;
                  hostParentIsContainer = true;
                  break a;
              }
              parent = parent.return;
            }
            if (null === hostParent) throw Error(formatProdErrorMessage(160));
            commitDeletionEffectsOnFiber(root2, returnFiber, childToDelete);
            hostParent = null;
            hostParentIsContainer = false;
            root2 = childToDelete.alternate;
            null !== root2 && (root2.return = null);
            childToDelete.return = null;
          }
        if (parentFiber.subtreeFlags & 13886)
          for (parentFiber = parentFiber.child; null !== parentFiber; )
            commitMutationEffectsOnFiber(parentFiber, root$jscomp$0), parentFiber = parentFiber.sibling;
      }
      var currentHoistableRoot = null;
      function commitMutationEffectsOnFiber(finishedWork, root2) {
        var current = finishedWork.alternate, flags = finishedWork.flags;
        switch (finishedWork.tag) {
          case 0:
          case 11:
          case 14:
          case 15:
            recursivelyTraverseMutationEffects(root2, finishedWork);
            commitReconciliationEffects(finishedWork);
            flags & 4 && (commitHookEffectListUnmount(3, finishedWork, finishedWork.return), commitHookEffectListMount(3, finishedWork), commitHookEffectListUnmount(5, finishedWork, finishedWork.return));
            break;
          case 1:
            recursivelyTraverseMutationEffects(root2, finishedWork);
            commitReconciliationEffects(finishedWork);
            flags & 512 && (offscreenSubtreeWasHidden || null === current || safelyDetachRef(current, current.return));
            flags & 64 && offscreenSubtreeIsHidden && (finishedWork = finishedWork.updateQueue, null !== finishedWork && (flags = finishedWork.callbacks, null !== flags && (current = finishedWork.shared.hiddenCallbacks, finishedWork.shared.hiddenCallbacks = null === current ? flags : current.concat(flags))));
            break;
          case 26:
            var hoistableRoot = currentHoistableRoot;
            recursivelyTraverseMutationEffects(root2, finishedWork);
            commitReconciliationEffects(finishedWork);
            flags & 512 && (offscreenSubtreeWasHidden || null === current || safelyDetachRef(current, current.return));
            if (flags & 4) {
              var currentResource = null !== current ? current.memoizedState : null;
              flags = finishedWork.memoizedState;
              if (null === current)
                if (null === flags)
                  if (null === finishedWork.stateNode) {
                    a: {
                      flags = finishedWork.type;
                      current = finishedWork.memoizedProps;
                      hoistableRoot = hoistableRoot.ownerDocument || hoistableRoot;
                      b: switch (flags) {
                        case "title":
                          currentResource = hoistableRoot.getElementsByTagName("title")[0];
                          if (!currentResource || currentResource[internalHoistableMarker] || currentResource[internalInstanceKey] || "http://www.w3.org/2000/svg" === currentResource.namespaceURI || currentResource.hasAttribute("itemprop"))
                            currentResource = hoistableRoot.createElement(flags), hoistableRoot.head.insertBefore(
                              currentResource,
                              hoistableRoot.querySelector("head > title")
                            );
                          setInitialProperties(currentResource, flags, current);
                          currentResource[internalInstanceKey] = finishedWork;
                          markNodeAsHoistable(currentResource);
                          flags = currentResource;
                          break a;
                        case "link":
                          var maybeNodes = getHydratableHoistableCache(
                            "link",
                            "href",
                            hoistableRoot
                          ).get(flags + (current.href || ""));
                          if (maybeNodes) {
                            for (var i = 0; i < maybeNodes.length; i++)
                              if (currentResource = maybeNodes[i], currentResource.getAttribute("href") === (null == current.href || "" === current.href ? null : current.href) && currentResource.getAttribute("rel") === (null == current.rel ? null : current.rel) && currentResource.getAttribute("title") === (null == current.title ? null : current.title) && currentResource.getAttribute("crossorigin") === (null == current.crossOrigin ? null : current.crossOrigin)) {
                                maybeNodes.splice(i, 1);
                                break b;
                              }
                          }
                          currentResource = hoistableRoot.createElement(flags);
                          setInitialProperties(currentResource, flags, current);
                          hoistableRoot.head.appendChild(currentResource);
                          break;
                        case "meta":
                          if (maybeNodes = getHydratableHoistableCache(
                            "meta",
                            "content",
                            hoistableRoot
                          ).get(flags + (current.content || ""))) {
                            for (i = 0; i < maybeNodes.length; i++)
                              if (currentResource = maybeNodes[i], currentResource.getAttribute("content") === (null == current.content ? null : "" + current.content) && currentResource.getAttribute("name") === (null == current.name ? null : current.name) && currentResource.getAttribute("property") === (null == current.property ? null : current.property) && currentResource.getAttribute("http-equiv") === (null == current.httpEquiv ? null : current.httpEquiv) && currentResource.getAttribute("charset") === (null == current.charSet ? null : current.charSet)) {
                                maybeNodes.splice(i, 1);
                                break b;
                              }
                          }
                          currentResource = hoistableRoot.createElement(flags);
                          setInitialProperties(currentResource, flags, current);
                          hoistableRoot.head.appendChild(currentResource);
                          break;
                        default:
                          throw Error(formatProdErrorMessage(468, flags));
                      }
                      currentResource[internalInstanceKey] = finishedWork;
                      markNodeAsHoistable(currentResource);
                      flags = currentResource;
                    }
                    finishedWork.stateNode = flags;
                  } else
                    mountHoistable(
                      hoistableRoot,
                      finishedWork.type,
                      finishedWork.stateNode
                    );
                else
                  finishedWork.stateNode = acquireResource(
                    hoistableRoot,
                    flags,
                    finishedWork.memoizedProps
                  );
              else
                currentResource !== flags ? (null === currentResource ? null !== current.stateNode && (current = current.stateNode, current.parentNode.removeChild(current)) : currentResource.count--, null === flags ? mountHoistable(
                  hoistableRoot,
                  finishedWork.type,
                  finishedWork.stateNode
                ) : acquireResource(
                  hoistableRoot,
                  flags,
                  finishedWork.memoizedProps
                )) : null === flags && null !== finishedWork.stateNode && commitHostUpdate(
                  finishedWork,
                  finishedWork.memoizedProps,
                  current.memoizedProps
                );
            }
            break;
          case 27:
            recursivelyTraverseMutationEffects(root2, finishedWork);
            commitReconciliationEffects(finishedWork);
            flags & 512 && (offscreenSubtreeWasHidden || null === current || safelyDetachRef(current, current.return));
            null !== current && flags & 4 && commitHostUpdate(
              finishedWork,
              finishedWork.memoizedProps,
              current.memoizedProps
            );
            break;
          case 5:
            recursivelyTraverseMutationEffects(root2, finishedWork);
            commitReconciliationEffects(finishedWork);
            flags & 512 && (offscreenSubtreeWasHidden || null === current || safelyDetachRef(current, current.return));
            if (finishedWork.flags & 32) {
              hoistableRoot = finishedWork.stateNode;
              try {
                setTextContent(hoistableRoot, "");
              } catch (error) {
                captureCommitPhaseError(finishedWork, finishedWork.return, error);
              }
            }
            flags & 4 && null != finishedWork.stateNode && (hoistableRoot = finishedWork.memoizedProps, commitHostUpdate(
              finishedWork,
              hoistableRoot,
              null !== current ? current.memoizedProps : hoistableRoot
            ));
            flags & 1024 && (needsFormReset = true);
            break;
          case 6:
            recursivelyTraverseMutationEffects(root2, finishedWork);
            commitReconciliationEffects(finishedWork);
            if (flags & 4) {
              if (null === finishedWork.stateNode)
                throw Error(formatProdErrorMessage(162));
              flags = finishedWork.memoizedProps;
              current = finishedWork.stateNode;
              try {
                current.nodeValue = flags;
              } catch (error) {
                captureCommitPhaseError(finishedWork, finishedWork.return, error);
              }
            }
            break;
          case 3:
            tagCaches = null;
            hoistableRoot = currentHoistableRoot;
            currentHoistableRoot = getHoistableRoot(root2.containerInfo);
            recursivelyTraverseMutationEffects(root2, finishedWork);
            currentHoistableRoot = hoistableRoot;
            commitReconciliationEffects(finishedWork);
            if (flags & 4 && null !== current && current.memoizedState.isDehydrated)
              try {
                retryIfBlockedOn(root2.containerInfo);
              } catch (error) {
                captureCommitPhaseError(finishedWork, finishedWork.return, error);
              }
            needsFormReset && (needsFormReset = false, recursivelyResetForms(finishedWork));
            break;
          case 4:
            flags = currentHoistableRoot;
            currentHoistableRoot = getHoistableRoot(
              finishedWork.stateNode.containerInfo
            );
            recursivelyTraverseMutationEffects(root2, finishedWork);
            commitReconciliationEffects(finishedWork);
            currentHoistableRoot = flags;
            break;
          case 12:
            recursivelyTraverseMutationEffects(root2, finishedWork);
            commitReconciliationEffects(finishedWork);
            break;
          case 31:
            recursivelyTraverseMutationEffects(root2, finishedWork);
            commitReconciliationEffects(finishedWork);
            flags & 4 && (flags = finishedWork.updateQueue, null !== flags && (finishedWork.updateQueue = null, attachSuspenseRetryListeners(finishedWork, flags)));
            break;
          case 13:
            recursivelyTraverseMutationEffects(root2, finishedWork);
            commitReconciliationEffects(finishedWork);
            finishedWork.child.flags & 8192 && null !== finishedWork.memoizedState !== (null !== current && null !== current.memoizedState) && (globalMostRecentFallbackTime = now());
            flags & 4 && (flags = finishedWork.updateQueue, null !== flags && (finishedWork.updateQueue = null, attachSuspenseRetryListeners(finishedWork, flags)));
            break;
          case 22:
            hoistableRoot = null !== finishedWork.memoizedState;
            var wasHidden = null !== current && null !== current.memoizedState, prevOffscreenSubtreeIsHidden = offscreenSubtreeIsHidden, prevOffscreenSubtreeWasHidden = offscreenSubtreeWasHidden;
            offscreenSubtreeIsHidden = prevOffscreenSubtreeIsHidden || hoistableRoot;
            offscreenSubtreeWasHidden = prevOffscreenSubtreeWasHidden || wasHidden;
            recursivelyTraverseMutationEffects(root2, finishedWork);
            offscreenSubtreeWasHidden = prevOffscreenSubtreeWasHidden;
            offscreenSubtreeIsHidden = prevOffscreenSubtreeIsHidden;
            commitReconciliationEffects(finishedWork);
            if (flags & 8192)
              a: for (root2 = finishedWork.stateNode, root2._visibility = hoistableRoot ? root2._visibility & -2 : root2._visibility | 1, hoistableRoot && (null === current || wasHidden || offscreenSubtreeIsHidden || offscreenSubtreeWasHidden || recursivelyTraverseDisappearLayoutEffects(finishedWork)), current = null, root2 = finishedWork; ; ) {
                if (5 === root2.tag || 26 === root2.tag) {
                  if (null === current) {
                    wasHidden = current = root2;
                    try {
                      if (currentResource = wasHidden.stateNode, hoistableRoot)
                        maybeNodes = currentResource.style, "function" === typeof maybeNodes.setProperty ? maybeNodes.setProperty("display", "none", "important") : maybeNodes.display = "none";
                      else {
                        i = wasHidden.stateNode;
                        var styleProp = wasHidden.memoizedProps.style, display = void 0 !== styleProp && null !== styleProp && styleProp.hasOwnProperty("display") ? styleProp.display : null;
                        i.style.display = null == display || "boolean" === typeof display ? "" : ("" + display).trim();
                      }
                    } catch (error) {
                      captureCommitPhaseError(wasHidden, wasHidden.return, error);
                    }
                  }
                } else if (6 === root2.tag) {
                  if (null === current) {
                    wasHidden = root2;
                    try {
                      wasHidden.stateNode.nodeValue = hoistableRoot ? "" : wasHidden.memoizedProps;
                    } catch (error) {
                      captureCommitPhaseError(wasHidden, wasHidden.return, error);
                    }
                  }
                } else if (18 === root2.tag) {
                  if (null === current) {
                    wasHidden = root2;
                    try {
                      var instance = wasHidden.stateNode;
                      hoistableRoot ? hideOrUnhideDehydratedBoundary(instance, true) : hideOrUnhideDehydratedBoundary(wasHidden.stateNode, false);
                    } catch (error) {
                      captureCommitPhaseError(wasHidden, wasHidden.return, error);
                    }
                  }
                } else if ((22 !== root2.tag && 23 !== root2.tag || null === root2.memoizedState || root2 === finishedWork) && null !== root2.child) {
                  root2.child.return = root2;
                  root2 = root2.child;
                  continue;
                }
                if (root2 === finishedWork) break a;
                for (; null === root2.sibling; ) {
                  if (null === root2.return || root2.return === finishedWork) break a;
                  current === root2 && (current = null);
                  root2 = root2.return;
                }
                current === root2 && (current = null);
                root2.sibling.return = root2.return;
                root2 = root2.sibling;
              }
            flags & 4 && (flags = finishedWork.updateQueue, null !== flags && (current = flags.retryQueue, null !== current && (flags.retryQueue = null, attachSuspenseRetryListeners(finishedWork, current))));
            break;
          case 19:
            recursivelyTraverseMutationEffects(root2, finishedWork);
            commitReconciliationEffects(finishedWork);
            flags & 4 && (flags = finishedWork.updateQueue, null !== flags && (finishedWork.updateQueue = null, attachSuspenseRetryListeners(finishedWork, flags)));
            break;
          case 30:
            break;
          case 21:
            break;
          default:
            recursivelyTraverseMutationEffects(root2, finishedWork), commitReconciliationEffects(finishedWork);
        }
      }
      function commitReconciliationEffects(finishedWork) {
        var flags = finishedWork.flags;
        if (flags & 2) {
          try {
            for (var hostParentFiber, parentFiber = finishedWork.return; null !== parentFiber; ) {
              if (isHostParent(parentFiber)) {
                hostParentFiber = parentFiber;
                break;
              }
              parentFiber = parentFiber.return;
            }
            if (null == hostParentFiber) throw Error(formatProdErrorMessage(160));
            switch (hostParentFiber.tag) {
              case 27:
                var parent = hostParentFiber.stateNode, before = getHostSibling(finishedWork);
                insertOrAppendPlacementNode(finishedWork, before, parent);
                break;
              case 5:
                var parent$141 = hostParentFiber.stateNode;
                hostParentFiber.flags & 32 && (setTextContent(parent$141, ""), hostParentFiber.flags &= -33);
                var before$142 = getHostSibling(finishedWork);
                insertOrAppendPlacementNode(finishedWork, before$142, parent$141);
                break;
              case 3:
              case 4:
                var parent$143 = hostParentFiber.stateNode.containerInfo, before$144 = getHostSibling(finishedWork);
                insertOrAppendPlacementNodeIntoContainer(
                  finishedWork,
                  before$144,
                  parent$143
                );
                break;
              default:
                throw Error(formatProdErrorMessage(161));
            }
          } catch (error) {
            captureCommitPhaseError(finishedWork, finishedWork.return, error);
          }
          finishedWork.flags &= -3;
        }
        flags & 4096 && (finishedWork.flags &= -4097);
      }
      function recursivelyResetForms(parentFiber) {
        if (parentFiber.subtreeFlags & 1024)
          for (parentFiber = parentFiber.child; null !== parentFiber; ) {
            var fiber = parentFiber;
            recursivelyResetForms(fiber);
            5 === fiber.tag && fiber.flags & 1024 && fiber.stateNode.reset();
            parentFiber = parentFiber.sibling;
          }
      }
      function recursivelyTraverseLayoutEffects(root2, parentFiber) {
        if (parentFiber.subtreeFlags & 8772)
          for (parentFiber = parentFiber.child; null !== parentFiber; )
            commitLayoutEffectOnFiber(root2, parentFiber.alternate, parentFiber), parentFiber = parentFiber.sibling;
      }
      function recursivelyTraverseDisappearLayoutEffects(parentFiber) {
        for (parentFiber = parentFiber.child; null !== parentFiber; ) {
          var finishedWork = parentFiber;
          switch (finishedWork.tag) {
            case 0:
            case 11:
            case 14:
            case 15:
              commitHookEffectListUnmount(4, finishedWork, finishedWork.return);
              recursivelyTraverseDisappearLayoutEffects(finishedWork);
              break;
            case 1:
              safelyDetachRef(finishedWork, finishedWork.return);
              var instance = finishedWork.stateNode;
              "function" === typeof instance.componentWillUnmount && safelyCallComponentWillUnmount(
                finishedWork,
                finishedWork.return,
                instance
              );
              recursivelyTraverseDisappearLayoutEffects(finishedWork);
              break;
            case 27:
              releaseSingletonInstance(finishedWork.stateNode);
            case 26:
            case 5:
              safelyDetachRef(finishedWork, finishedWork.return);
              recursivelyTraverseDisappearLayoutEffects(finishedWork);
              break;
            case 22:
              null === finishedWork.memoizedState && recursivelyTraverseDisappearLayoutEffects(finishedWork);
              break;
            case 30:
              recursivelyTraverseDisappearLayoutEffects(finishedWork);
              break;
            default:
              recursivelyTraverseDisappearLayoutEffects(finishedWork);
          }
          parentFiber = parentFiber.sibling;
        }
      }
      function recursivelyTraverseReappearLayoutEffects(finishedRoot$jscomp$0, parentFiber, includeWorkInProgressEffects) {
        includeWorkInProgressEffects = includeWorkInProgressEffects && 0 !== (parentFiber.subtreeFlags & 8772);
        for (parentFiber = parentFiber.child; null !== parentFiber; ) {
          var current = parentFiber.alternate, finishedRoot = finishedRoot$jscomp$0, finishedWork = parentFiber, flags = finishedWork.flags;
          switch (finishedWork.tag) {
            case 0:
            case 11:
            case 15:
              recursivelyTraverseReappearLayoutEffects(
                finishedRoot,
                finishedWork,
                includeWorkInProgressEffects
              );
              commitHookEffectListMount(4, finishedWork);
              break;
            case 1:
              recursivelyTraverseReappearLayoutEffects(
                finishedRoot,
                finishedWork,
                includeWorkInProgressEffects
              );
              current = finishedWork;
              finishedRoot = current.stateNode;
              if ("function" === typeof finishedRoot.componentDidMount)
                try {
                  finishedRoot.componentDidMount();
                } catch (error) {
                  captureCommitPhaseError(current, current.return, error);
                }
              current = finishedWork;
              finishedRoot = current.updateQueue;
              if (null !== finishedRoot) {
                var instance = current.stateNode;
                try {
                  var hiddenCallbacks = finishedRoot.shared.hiddenCallbacks;
                  if (null !== hiddenCallbacks)
                    for (finishedRoot.shared.hiddenCallbacks = null, finishedRoot = 0; finishedRoot < hiddenCallbacks.length; finishedRoot++)
                      callCallback(hiddenCallbacks[finishedRoot], instance);
                } catch (error) {
                  captureCommitPhaseError(current, current.return, error);
                }
              }
              includeWorkInProgressEffects && flags & 64 && commitClassCallbacks(finishedWork);
              safelyAttachRef(finishedWork, finishedWork.return);
              break;
            case 27:
              commitHostSingletonAcquisition(finishedWork);
            case 26:
            case 5:
              recursivelyTraverseReappearLayoutEffects(
                finishedRoot,
                finishedWork,
                includeWorkInProgressEffects
              );
              includeWorkInProgressEffects && null === current && flags & 4 && commitHostMount(finishedWork);
              safelyAttachRef(finishedWork, finishedWork.return);
              break;
            case 12:
              recursivelyTraverseReappearLayoutEffects(
                finishedRoot,
                finishedWork,
                includeWorkInProgressEffects
              );
              break;
            case 31:
              recursivelyTraverseReappearLayoutEffects(
                finishedRoot,
                finishedWork,
                includeWorkInProgressEffects
              );
              includeWorkInProgressEffects && flags & 4 && commitActivityHydrationCallbacks(finishedRoot, finishedWork);
              break;
            case 13:
              recursivelyTraverseReappearLayoutEffects(
                finishedRoot,
                finishedWork,
                includeWorkInProgressEffects
              );
              includeWorkInProgressEffects && flags & 4 && commitSuspenseHydrationCallbacks(finishedRoot, finishedWork);
              break;
            case 22:
              null === finishedWork.memoizedState && recursivelyTraverseReappearLayoutEffects(
                finishedRoot,
                finishedWork,
                includeWorkInProgressEffects
              );
              safelyAttachRef(finishedWork, finishedWork.return);
              break;
            case 30:
              break;
            default:
              recursivelyTraverseReappearLayoutEffects(
                finishedRoot,
                finishedWork,
                includeWorkInProgressEffects
              );
          }
          parentFiber = parentFiber.sibling;
        }
      }
      function commitOffscreenPassiveMountEffects(current, finishedWork) {
        var previousCache = null;
        null !== current && null !== current.memoizedState && null !== current.memoizedState.cachePool && (previousCache = current.memoizedState.cachePool.pool);
        current = null;
        null !== finishedWork.memoizedState && null !== finishedWork.memoizedState.cachePool && (current = finishedWork.memoizedState.cachePool.pool);
        current !== previousCache && (null != current && current.refCount++, null != previousCache && releaseCache(previousCache));
      }
      function commitCachePassiveMountEffect(current, finishedWork) {
        current = null;
        null !== finishedWork.alternate && (current = finishedWork.alternate.memoizedState.cache);
        finishedWork = finishedWork.memoizedState.cache;
        finishedWork !== current && (finishedWork.refCount++, null != current && releaseCache(current));
      }
      function recursivelyTraversePassiveMountEffects(root2, parentFiber, committedLanes, committedTransitions) {
        if (parentFiber.subtreeFlags & 10256)
          for (parentFiber = parentFiber.child; null !== parentFiber; )
            commitPassiveMountOnFiber(
              root2,
              parentFiber,
              committedLanes,
              committedTransitions
            ), parentFiber = parentFiber.sibling;
      }
      function commitPassiveMountOnFiber(finishedRoot, finishedWork, committedLanes, committedTransitions) {
        var flags = finishedWork.flags;
        switch (finishedWork.tag) {
          case 0:
          case 11:
          case 15:
            recursivelyTraversePassiveMountEffects(
              finishedRoot,
              finishedWork,
              committedLanes,
              committedTransitions
            );
            flags & 2048 && commitHookEffectListMount(9, finishedWork);
            break;
          case 1:
            recursivelyTraversePassiveMountEffects(
              finishedRoot,
              finishedWork,
              committedLanes,
              committedTransitions
            );
            break;
          case 3:
            recursivelyTraversePassiveMountEffects(
              finishedRoot,
              finishedWork,
              committedLanes,
              committedTransitions
            );
            flags & 2048 && (finishedRoot = null, null !== finishedWork.alternate && (finishedRoot = finishedWork.alternate.memoizedState.cache), finishedWork = finishedWork.memoizedState.cache, finishedWork !== finishedRoot && (finishedWork.refCount++, null != finishedRoot && releaseCache(finishedRoot)));
            break;
          case 12:
            if (flags & 2048) {
              recursivelyTraversePassiveMountEffects(
                finishedRoot,
                finishedWork,
                committedLanes,
                committedTransitions
              );
              finishedRoot = finishedWork.stateNode;
              try {
                var _finishedWork$memoize2 = finishedWork.memoizedProps, id = _finishedWork$memoize2.id, onPostCommit = _finishedWork$memoize2.onPostCommit;
                "function" === typeof onPostCommit && onPostCommit(
                  id,
                  null === finishedWork.alternate ? "mount" : "update",
                  finishedRoot.passiveEffectDuration,
                  -0
                );
              } catch (error) {
                captureCommitPhaseError(finishedWork, finishedWork.return, error);
              }
            } else
              recursivelyTraversePassiveMountEffects(
                finishedRoot,
                finishedWork,
                committedLanes,
                committedTransitions
              );
            break;
          case 31:
            recursivelyTraversePassiveMountEffects(
              finishedRoot,
              finishedWork,
              committedLanes,
              committedTransitions
            );
            break;
          case 13:
            recursivelyTraversePassiveMountEffects(
              finishedRoot,
              finishedWork,
              committedLanes,
              committedTransitions
            );
            break;
          case 23:
            break;
          case 22:
            _finishedWork$memoize2 = finishedWork.stateNode;
            id = finishedWork.alternate;
            null !== finishedWork.memoizedState ? _finishedWork$memoize2._visibility & 2 ? recursivelyTraversePassiveMountEffects(
              finishedRoot,
              finishedWork,
              committedLanes,
              committedTransitions
            ) : recursivelyTraverseAtomicPassiveEffects(finishedRoot, finishedWork) : _finishedWork$memoize2._visibility & 2 ? recursivelyTraversePassiveMountEffects(
              finishedRoot,
              finishedWork,
              committedLanes,
              committedTransitions
            ) : (_finishedWork$memoize2._visibility |= 2, recursivelyTraverseReconnectPassiveEffects(
              finishedRoot,
              finishedWork,
              committedLanes,
              committedTransitions,
              0 !== (finishedWork.subtreeFlags & 10256) || false
            ));
            flags & 2048 && commitOffscreenPassiveMountEffects(id, finishedWork);
            break;
          case 24:
            recursivelyTraversePassiveMountEffects(
              finishedRoot,
              finishedWork,
              committedLanes,
              committedTransitions
            );
            flags & 2048 && commitCachePassiveMountEffect(finishedWork.alternate, finishedWork);
            break;
          default:
            recursivelyTraversePassiveMountEffects(
              finishedRoot,
              finishedWork,
              committedLanes,
              committedTransitions
            );
        }
      }
      function recursivelyTraverseReconnectPassiveEffects(finishedRoot$jscomp$0, parentFiber, committedLanes$jscomp$0, committedTransitions$jscomp$0, includeWorkInProgressEffects) {
        includeWorkInProgressEffects = includeWorkInProgressEffects && (0 !== (parentFiber.subtreeFlags & 10256) || false);
        for (parentFiber = parentFiber.child; null !== parentFiber; ) {
          var finishedRoot = finishedRoot$jscomp$0, finishedWork = parentFiber, committedLanes = committedLanes$jscomp$0, committedTransitions = committedTransitions$jscomp$0, flags = finishedWork.flags;
          switch (finishedWork.tag) {
            case 0:
            case 11:
            case 15:
              recursivelyTraverseReconnectPassiveEffects(
                finishedRoot,
                finishedWork,
                committedLanes,
                committedTransitions,
                includeWorkInProgressEffects
              );
              commitHookEffectListMount(8, finishedWork);
              break;
            case 23:
              break;
            case 22:
              var instance = finishedWork.stateNode;
              null !== finishedWork.memoizedState ? instance._visibility & 2 ? recursivelyTraverseReconnectPassiveEffects(
                finishedRoot,
                finishedWork,
                committedLanes,
                committedTransitions,
                includeWorkInProgressEffects
              ) : recursivelyTraverseAtomicPassiveEffects(
                finishedRoot,
                finishedWork
              ) : (instance._visibility |= 2, recursivelyTraverseReconnectPassiveEffects(
                finishedRoot,
                finishedWork,
                committedLanes,
                committedTransitions,
                includeWorkInProgressEffects
              ));
              includeWorkInProgressEffects && flags & 2048 && commitOffscreenPassiveMountEffects(
                finishedWork.alternate,
                finishedWork
              );
              break;
            case 24:
              recursivelyTraverseReconnectPassiveEffects(
                finishedRoot,
                finishedWork,
                committedLanes,
                committedTransitions,
                includeWorkInProgressEffects
              );
              includeWorkInProgressEffects && flags & 2048 && commitCachePassiveMountEffect(finishedWork.alternate, finishedWork);
              break;
            default:
              recursivelyTraverseReconnectPassiveEffects(
                finishedRoot,
                finishedWork,
                committedLanes,
                committedTransitions,
                includeWorkInProgressEffects
              );
          }
          parentFiber = parentFiber.sibling;
        }
      }
      function recursivelyTraverseAtomicPassiveEffects(finishedRoot$jscomp$0, parentFiber) {
        if (parentFiber.subtreeFlags & 10256)
          for (parentFiber = parentFiber.child; null !== parentFiber; ) {
            var finishedRoot = finishedRoot$jscomp$0, finishedWork = parentFiber, flags = finishedWork.flags;
            switch (finishedWork.tag) {
              case 22:
                recursivelyTraverseAtomicPassiveEffects(finishedRoot, finishedWork);
                flags & 2048 && commitOffscreenPassiveMountEffects(
                  finishedWork.alternate,
                  finishedWork
                );
                break;
              case 24:
                recursivelyTraverseAtomicPassiveEffects(finishedRoot, finishedWork);
                flags & 2048 && commitCachePassiveMountEffect(finishedWork.alternate, finishedWork);
                break;
              default:
                recursivelyTraverseAtomicPassiveEffects(finishedRoot, finishedWork);
            }
            parentFiber = parentFiber.sibling;
          }
      }
      var suspenseyCommitFlag = 8192;
      function recursivelyAccumulateSuspenseyCommit(parentFiber, committedLanes, suspendedState) {
        if (parentFiber.subtreeFlags & suspenseyCommitFlag)
          for (parentFiber = parentFiber.child; null !== parentFiber; )
            accumulateSuspenseyCommitOnFiber(
              parentFiber,
              committedLanes,
              suspendedState
            ), parentFiber = parentFiber.sibling;
      }
      function accumulateSuspenseyCommitOnFiber(fiber, committedLanes, suspendedState) {
        switch (fiber.tag) {
          case 26:
            recursivelyAccumulateSuspenseyCommit(
              fiber,
              committedLanes,
              suspendedState
            );
            fiber.flags & suspenseyCommitFlag && null !== fiber.memoizedState && suspendResource(
              suspendedState,
              currentHoistableRoot,
              fiber.memoizedState,
              fiber.memoizedProps
            );
            break;
          case 5:
            recursivelyAccumulateSuspenseyCommit(
              fiber,
              committedLanes,
              suspendedState
            );
            break;
          case 3:
          case 4:
            var previousHoistableRoot = currentHoistableRoot;
            currentHoistableRoot = getHoistableRoot(fiber.stateNode.containerInfo);
            recursivelyAccumulateSuspenseyCommit(
              fiber,
              committedLanes,
              suspendedState
            );
            currentHoistableRoot = previousHoistableRoot;
            break;
          case 22:
            null === fiber.memoizedState && (previousHoistableRoot = fiber.alternate, null !== previousHoistableRoot && null !== previousHoistableRoot.memoizedState ? (previousHoistableRoot = suspenseyCommitFlag, suspenseyCommitFlag = 16777216, recursivelyAccumulateSuspenseyCommit(
              fiber,
              committedLanes,
              suspendedState
            ), suspenseyCommitFlag = previousHoistableRoot) : recursivelyAccumulateSuspenseyCommit(
              fiber,
              committedLanes,
              suspendedState
            ));
            break;
          default:
            recursivelyAccumulateSuspenseyCommit(
              fiber,
              committedLanes,
              suspendedState
            );
        }
      }
      function detachAlternateSiblings(parentFiber) {
        var previousFiber = parentFiber.alternate;
        if (null !== previousFiber && (parentFiber = previousFiber.child, null !== parentFiber)) {
          previousFiber.child = null;
          do
            previousFiber = parentFiber.sibling, parentFiber.sibling = null, parentFiber = previousFiber;
          while (null !== parentFiber);
        }
      }
      function recursivelyTraversePassiveUnmountEffects(parentFiber) {
        var deletions = parentFiber.deletions;
        if (0 !== (parentFiber.flags & 16)) {
          if (null !== deletions)
            for (var i = 0; i < deletions.length; i++) {
              var childToDelete = deletions[i];
              nextEffect = childToDelete;
              commitPassiveUnmountEffectsInsideOfDeletedTree_begin(
                childToDelete,
                parentFiber
              );
            }
          detachAlternateSiblings(parentFiber);
        }
        if (parentFiber.subtreeFlags & 10256)
          for (parentFiber = parentFiber.child; null !== parentFiber; )
            commitPassiveUnmountOnFiber(parentFiber), parentFiber = parentFiber.sibling;
      }
      function commitPassiveUnmountOnFiber(finishedWork) {
        switch (finishedWork.tag) {
          case 0:
          case 11:
          case 15:
            recursivelyTraversePassiveUnmountEffects(finishedWork);
            finishedWork.flags & 2048 && commitHookEffectListUnmount(9, finishedWork, finishedWork.return);
            break;
          case 3:
            recursivelyTraversePassiveUnmountEffects(finishedWork);
            break;
          case 12:
            recursivelyTraversePassiveUnmountEffects(finishedWork);
            break;
          case 22:
            var instance = finishedWork.stateNode;
            null !== finishedWork.memoizedState && instance._visibility & 2 && (null === finishedWork.return || 13 !== finishedWork.return.tag) ? (instance._visibility &= -3, recursivelyTraverseDisconnectPassiveEffects(finishedWork)) : recursivelyTraversePassiveUnmountEffects(finishedWork);
            break;
          default:
            recursivelyTraversePassiveUnmountEffects(finishedWork);
        }
      }
      function recursivelyTraverseDisconnectPassiveEffects(parentFiber) {
        var deletions = parentFiber.deletions;
        if (0 !== (parentFiber.flags & 16)) {
          if (null !== deletions)
            for (var i = 0; i < deletions.length; i++) {
              var childToDelete = deletions[i];
              nextEffect = childToDelete;
              commitPassiveUnmountEffectsInsideOfDeletedTree_begin(
                childToDelete,
                parentFiber
              );
            }
          detachAlternateSiblings(parentFiber);
        }
        for (parentFiber = parentFiber.child; null !== parentFiber; ) {
          deletions = parentFiber;
          switch (deletions.tag) {
            case 0:
            case 11:
            case 15:
              commitHookEffectListUnmount(8, deletions, deletions.return);
              recursivelyTraverseDisconnectPassiveEffects(deletions);
              break;
            case 22:
              i = deletions.stateNode;
              i._visibility & 2 && (i._visibility &= -3, recursivelyTraverseDisconnectPassiveEffects(deletions));
              break;
            default:
              recursivelyTraverseDisconnectPassiveEffects(deletions);
          }
          parentFiber = parentFiber.sibling;
        }
      }
      function commitPassiveUnmountEffectsInsideOfDeletedTree_begin(deletedSubtreeRoot, nearestMountedAncestor) {
        for (; null !== nextEffect; ) {
          var fiber = nextEffect;
          switch (fiber.tag) {
            case 0:
            case 11:
            case 15:
              commitHookEffectListUnmount(8, fiber, nearestMountedAncestor);
              break;
            case 23:
            case 22:
              if (null !== fiber.memoizedState && null !== fiber.memoizedState.cachePool) {
                var cache = fiber.memoizedState.cachePool.pool;
                null != cache && cache.refCount++;
              }
              break;
            case 24:
              releaseCache(fiber.memoizedState.cache);
          }
          cache = fiber.child;
          if (null !== cache) cache.return = fiber, nextEffect = cache;
          else
            a: for (fiber = deletedSubtreeRoot; null !== nextEffect; ) {
              cache = nextEffect;
              var sibling = cache.sibling, returnFiber = cache.return;
              detachFiberAfterEffects(cache);
              if (cache === fiber) {
                nextEffect = null;
                break a;
              }
              if (null !== sibling) {
                sibling.return = returnFiber;
                nextEffect = sibling;
                break a;
              }
              nextEffect = returnFiber;
            }
        }
      }
      var DefaultAsyncDispatcher = {
        getCacheForType: function(resourceType) {
          var cache = readContext(CacheContext), cacheForType = cache.data.get(resourceType);
          void 0 === cacheForType && (cacheForType = resourceType(), cache.data.set(resourceType, cacheForType));
          return cacheForType;
        },
        cacheSignal: function() {
          return readContext(CacheContext).controller.signal;
        }
      };
      var PossiblyWeakMap = "function" === typeof WeakMap ? WeakMap : Map;
      var executionContext = 0;
      var workInProgressRoot = null;
      var workInProgress = null;
      var workInProgressRootRenderLanes = 0;
      var workInProgressSuspendedReason = 0;
      var workInProgressThrownValue = null;
      var workInProgressRootDidSkipSuspendedSiblings = false;
      var workInProgressRootIsPrerendering = false;
      var workInProgressRootDidAttachPingListener = false;
      var entangledRenderLanes = 0;
      var workInProgressRootExitStatus = 0;
      var workInProgressRootSkippedLanes = 0;
      var workInProgressRootInterleavedUpdatedLanes = 0;
      var workInProgressRootPingedLanes = 0;
      var workInProgressDeferredLane = 0;
      var workInProgressSuspendedRetryLanes = 0;
      var workInProgressRootConcurrentErrors = null;
      var workInProgressRootRecoverableErrors = null;
      var workInProgressRootDidIncludeRecursiveRenderUpdate = false;
      var globalMostRecentFallbackTime = 0;
      var globalMostRecentTransitionTime = 0;
      var workInProgressRootRenderTargetTime = Infinity;
      var workInProgressTransitions = null;
      var legacyErrorBoundariesThatAlreadyFailed = null;
      var pendingEffectsStatus = 0;
      var pendingEffectsRoot = null;
      var pendingFinishedWork = null;
      var pendingEffectsLanes = 0;
      var pendingEffectsRemainingLanes = 0;
      var pendingPassiveTransitions = null;
      var pendingRecoverableErrors = null;
      var nestedUpdateCount = 0;
      var rootWithNestedUpdates = null;
      function requestUpdateLane() {
        return 0 !== (executionContext & 2) && 0 !== workInProgressRootRenderLanes ? workInProgressRootRenderLanes & -workInProgressRootRenderLanes : null !== ReactSharedInternals.T ? requestTransitionLane() : resolveUpdatePriority();
      }
      function requestDeferredLane() {
        if (0 === workInProgressDeferredLane)
          if (0 === (workInProgressRootRenderLanes & 536870912) || isHydrating) {
            var lane = nextTransitionDeferredLane;
            nextTransitionDeferredLane <<= 1;
            0 === (nextTransitionDeferredLane & 3932160) && (nextTransitionDeferredLane = 262144);
            workInProgressDeferredLane = lane;
          } else workInProgressDeferredLane = 536870912;
        lane = suspenseHandlerStackCursor.current;
        null !== lane && (lane.flags |= 32);
        return workInProgressDeferredLane;
      }
      function scheduleUpdateOnFiber(root2, fiber, lane) {
        if (root2 === workInProgressRoot && (2 === workInProgressSuspendedReason || 9 === workInProgressSuspendedReason) || null !== root2.cancelPendingCommit)
          prepareFreshStack(root2, 0), markRootSuspended(
            root2,
            workInProgressRootRenderLanes,
            workInProgressDeferredLane,
            false
          );
        markRootUpdated$1(root2, lane);
        if (0 === (executionContext & 2) || root2 !== workInProgressRoot)
          root2 === workInProgressRoot && (0 === (executionContext & 2) && (workInProgressRootInterleavedUpdatedLanes |= lane), 4 === workInProgressRootExitStatus && markRootSuspended(
            root2,
            workInProgressRootRenderLanes,
            workInProgressDeferredLane,
            false
          )), ensureRootIsScheduled(root2);
      }
      function performWorkOnRoot(root$jscomp$0, lanes, forceSync) {
        if (0 !== (executionContext & 6)) throw Error(formatProdErrorMessage(327));
        var shouldTimeSlice = !forceSync && 0 === (lanes & 127) && 0 === (lanes & root$jscomp$0.expiredLanes) || checkIfRootIsPrerendering(root$jscomp$0, lanes), exitStatus = shouldTimeSlice ? renderRootConcurrent(root$jscomp$0, lanes) : renderRootSync(root$jscomp$0, lanes, true), renderWasConcurrent = shouldTimeSlice;
        do {
          if (0 === exitStatus) {
            workInProgressRootIsPrerendering && !shouldTimeSlice && markRootSuspended(root$jscomp$0, lanes, 0, false);
            break;
          } else {
            forceSync = root$jscomp$0.current.alternate;
            if (renderWasConcurrent && !isRenderConsistentWithExternalStores(forceSync)) {
              exitStatus = renderRootSync(root$jscomp$0, lanes, false);
              renderWasConcurrent = false;
              continue;
            }
            if (2 === exitStatus) {
              renderWasConcurrent = lanes;
              if (root$jscomp$0.errorRecoveryDisabledLanes & renderWasConcurrent)
                var JSCompiler_inline_result = 0;
              else
                JSCompiler_inline_result = root$jscomp$0.pendingLanes & -536870913, JSCompiler_inline_result = 0 !== JSCompiler_inline_result ? JSCompiler_inline_result : JSCompiler_inline_result & 536870912 ? 536870912 : 0;
              if (0 !== JSCompiler_inline_result) {
                lanes = JSCompiler_inline_result;
                a: {
                  var root2 = root$jscomp$0;
                  exitStatus = workInProgressRootConcurrentErrors;
                  var wasRootDehydrated = root2.current.memoizedState.isDehydrated;
                  wasRootDehydrated && (prepareFreshStack(root2, JSCompiler_inline_result).flags |= 256);
                  JSCompiler_inline_result = renderRootSync(
                    root2,
                    JSCompiler_inline_result,
                    false
                  );
                  if (2 !== JSCompiler_inline_result) {
                    if (workInProgressRootDidAttachPingListener && !wasRootDehydrated) {
                      root2.errorRecoveryDisabledLanes |= renderWasConcurrent;
                      workInProgressRootInterleavedUpdatedLanes |= renderWasConcurrent;
                      exitStatus = 4;
                      break a;
                    }
                    renderWasConcurrent = workInProgressRootRecoverableErrors;
                    workInProgressRootRecoverableErrors = exitStatus;
                    null !== renderWasConcurrent && (null === workInProgressRootRecoverableErrors ? workInProgressRootRecoverableErrors = renderWasConcurrent : workInProgressRootRecoverableErrors.push.apply(
                      workInProgressRootRecoverableErrors,
                      renderWasConcurrent
                    ));
                  }
                  exitStatus = JSCompiler_inline_result;
                }
                renderWasConcurrent = false;
                if (2 !== exitStatus) continue;
              }
            }
            if (1 === exitStatus) {
              prepareFreshStack(root$jscomp$0, 0);
              markRootSuspended(root$jscomp$0, lanes, 0, true);
              break;
            }
            a: {
              shouldTimeSlice = root$jscomp$0;
              renderWasConcurrent = exitStatus;
              switch (renderWasConcurrent) {
                case 0:
                case 1:
                  throw Error(formatProdErrorMessage(345));
                case 4:
                  if ((lanes & 4194048) !== lanes) break;
                case 6:
                  markRootSuspended(
                    shouldTimeSlice,
                    lanes,
                    workInProgressDeferredLane,
                    !workInProgressRootDidSkipSuspendedSiblings
                  );
                  break a;
                case 2:
                  workInProgressRootRecoverableErrors = null;
                  break;
                case 3:
                case 5:
                  break;
                default:
                  throw Error(formatProdErrorMessage(329));
              }
              if ((lanes & 62914560) === lanes && (exitStatus = globalMostRecentFallbackTime + 300 - now(), 10 < exitStatus)) {
                markRootSuspended(
                  shouldTimeSlice,
                  lanes,
                  workInProgressDeferredLane,
                  !workInProgressRootDidSkipSuspendedSiblings
                );
                if (0 !== getNextLanes(shouldTimeSlice, 0, true)) break a;
                pendingEffectsLanes = lanes;
                shouldTimeSlice.timeoutHandle = scheduleTimeout(
                  commitRootWhenReady.bind(
                    null,
                    shouldTimeSlice,
                    forceSync,
                    workInProgressRootRecoverableErrors,
                    workInProgressTransitions,
                    workInProgressRootDidIncludeRecursiveRenderUpdate,
                    lanes,
                    workInProgressDeferredLane,
                    workInProgressRootInterleavedUpdatedLanes,
                    workInProgressSuspendedRetryLanes,
                    workInProgressRootDidSkipSuspendedSiblings,
                    renderWasConcurrent,
                    "Throttled",
                    -0,
                    0
                  ),
                  exitStatus
                );
                break a;
              }
              commitRootWhenReady(
                shouldTimeSlice,
                forceSync,
                workInProgressRootRecoverableErrors,
                workInProgressTransitions,
                workInProgressRootDidIncludeRecursiveRenderUpdate,
                lanes,
                workInProgressDeferredLane,
                workInProgressRootInterleavedUpdatedLanes,
                workInProgressSuspendedRetryLanes,
                workInProgressRootDidSkipSuspendedSiblings,
                renderWasConcurrent,
                null,
                -0,
                0
              );
            }
          }
          break;
        } while (1);
        ensureRootIsScheduled(root$jscomp$0);
      }
      function commitRootWhenReady(root2, finishedWork, recoverableErrors, transitions, didIncludeRenderPhaseUpdate, lanes, spawnedLane, updatedLanes, suspendedRetryLanes, didSkipSuspendedSiblings, exitStatus, suspendedCommitReason, completedRenderStartTime, completedRenderEndTime) {
        root2.timeoutHandle = -1;
        suspendedCommitReason = finishedWork.subtreeFlags;
        if (suspendedCommitReason & 8192 || 16785408 === (suspendedCommitReason & 16785408)) {
          suspendedCommitReason = {
            stylesheets: null,
            count: 0,
            imgCount: 0,
            imgBytes: 0,
            suspenseyImages: [],
            waitingForImages: true,
            waitingForViewTransition: false,
            unsuspend: noop$1
          };
          accumulateSuspenseyCommitOnFiber(
            finishedWork,
            lanes,
            suspendedCommitReason
          );
          var timeoutOffset = (lanes & 62914560) === lanes ? globalMostRecentFallbackTime - now() : (lanes & 4194048) === lanes ? globalMostRecentTransitionTime - now() : 0;
          timeoutOffset = waitForCommitToBeReady(
            suspendedCommitReason,
            timeoutOffset
          );
          if (null !== timeoutOffset) {
            pendingEffectsLanes = lanes;
            root2.cancelPendingCommit = timeoutOffset(
              commitRoot.bind(
                null,
                root2,
                finishedWork,
                lanes,
                recoverableErrors,
                transitions,
                didIncludeRenderPhaseUpdate,
                spawnedLane,
                updatedLanes,
                suspendedRetryLanes,
                exitStatus,
                suspendedCommitReason,
                null,
                completedRenderStartTime,
                completedRenderEndTime
              )
            );
            markRootSuspended(root2, lanes, spawnedLane, !didSkipSuspendedSiblings);
            return;
          }
        }
        commitRoot(
          root2,
          finishedWork,
          lanes,
          recoverableErrors,
          transitions,
          didIncludeRenderPhaseUpdate,
          spawnedLane,
          updatedLanes,
          suspendedRetryLanes
        );
      }
      function isRenderConsistentWithExternalStores(finishedWork) {
        for (var node = finishedWork; ; ) {
          var tag = node.tag;
          if ((0 === tag || 11 === tag || 15 === tag) && node.flags & 16384 && (tag = node.updateQueue, null !== tag && (tag = tag.stores, null !== tag)))
            for (var i = 0; i < tag.length; i++) {
              var check = tag[i], getSnapshot = check.getSnapshot;
              check = check.value;
              try {
                if (!objectIs(getSnapshot(), check)) return false;
              } catch (error) {
                return false;
              }
            }
          tag = node.child;
          if (node.subtreeFlags & 16384 && null !== tag)
            tag.return = node, node = tag;
          else {
            if (node === finishedWork) break;
            for (; null === node.sibling; ) {
              if (null === node.return || node.return === finishedWork) return true;
              node = node.return;
            }
            node.sibling.return = node.return;
            node = node.sibling;
          }
        }
        return true;
      }
      function markRootSuspended(root2, suspendedLanes, spawnedLane, didAttemptEntireTree) {
        suspendedLanes &= ~workInProgressRootPingedLanes;
        suspendedLanes &= ~workInProgressRootInterleavedUpdatedLanes;
        root2.suspendedLanes |= suspendedLanes;
        root2.pingedLanes &= ~suspendedLanes;
        didAttemptEntireTree && (root2.warmLanes |= suspendedLanes);
        didAttemptEntireTree = root2.expirationTimes;
        for (var lanes = suspendedLanes; 0 < lanes; ) {
          var index$6 = 31 - clz32(lanes), lane = 1 << index$6;
          didAttemptEntireTree[index$6] = -1;
          lanes &= ~lane;
        }
        0 !== spawnedLane && markSpawnedDeferredLane(root2, spawnedLane, suspendedLanes);
      }
      function flushSyncWork$1() {
        return 0 === (executionContext & 6) ? (flushSyncWorkAcrossRoots_impl(0, false), false) : true;
      }
      function resetWorkInProgressStack() {
        if (null !== workInProgress) {
          if (0 === workInProgressSuspendedReason)
            var interruptedWork = workInProgress.return;
          else
            interruptedWork = workInProgress, lastContextDependency = currentlyRenderingFiber$1 = null, resetHooksOnUnwind(interruptedWork), thenableState$1 = null, thenableIndexCounter$1 = 0, interruptedWork = workInProgress;
          for (; null !== interruptedWork; )
            unwindInterruptedWork(interruptedWork.alternate, interruptedWork), interruptedWork = interruptedWork.return;
          workInProgress = null;
        }
      }
      function prepareFreshStack(root2, lanes) {
        var timeoutHandle = root2.timeoutHandle;
        -1 !== timeoutHandle && (root2.timeoutHandle = -1, cancelTimeout(timeoutHandle));
        timeoutHandle = root2.cancelPendingCommit;
        null !== timeoutHandle && (root2.cancelPendingCommit = null, timeoutHandle());
        pendingEffectsLanes = 0;
        resetWorkInProgressStack();
        workInProgressRoot = root2;
        workInProgress = timeoutHandle = createWorkInProgress(root2.current, null);
        workInProgressRootRenderLanes = lanes;
        workInProgressSuspendedReason = 0;
        workInProgressThrownValue = null;
        workInProgressRootDidSkipSuspendedSiblings = false;
        workInProgressRootIsPrerendering = checkIfRootIsPrerendering(root2, lanes);
        workInProgressRootDidAttachPingListener = false;
        workInProgressSuspendedRetryLanes = workInProgressDeferredLane = workInProgressRootPingedLanes = workInProgressRootInterleavedUpdatedLanes = workInProgressRootSkippedLanes = workInProgressRootExitStatus = 0;
        workInProgressRootRecoverableErrors = workInProgressRootConcurrentErrors = null;
        workInProgressRootDidIncludeRecursiveRenderUpdate = false;
        0 !== (lanes & 8) && (lanes |= lanes & 32);
        var allEntangledLanes = root2.entangledLanes;
        if (0 !== allEntangledLanes)
          for (root2 = root2.entanglements, allEntangledLanes &= lanes; 0 < allEntangledLanes; ) {
            var index$4 = 31 - clz32(allEntangledLanes), lane = 1 << index$4;
            lanes |= root2[index$4];
            allEntangledLanes &= ~lane;
          }
        entangledRenderLanes = lanes;
        finishQueueingConcurrentUpdates();
        return timeoutHandle;
      }
      function handleThrow(root2, thrownValue) {
        currentlyRenderingFiber = null;
        ReactSharedInternals.H = ContextOnlyDispatcher;
        thrownValue === SuspenseException || thrownValue === SuspenseActionException ? (thrownValue = getSuspendedThenable(), workInProgressSuspendedReason = 3) : thrownValue === SuspenseyCommitException ? (thrownValue = getSuspendedThenable(), workInProgressSuspendedReason = 4) : workInProgressSuspendedReason = thrownValue === SelectiveHydrationException ? 8 : null !== thrownValue && "object" === typeof thrownValue && "function" === typeof thrownValue.then ? 6 : 1;
        workInProgressThrownValue = thrownValue;
        null === workInProgress && (workInProgressRootExitStatus = 1, logUncaughtError(
          root2,
          createCapturedValueAtFiber(thrownValue, root2.current)
        ));
      }
      function shouldRemainOnPreviousScreen() {
        var handler = suspenseHandlerStackCursor.current;
        return null === handler ? true : (workInProgressRootRenderLanes & 4194048) === workInProgressRootRenderLanes ? null === shellBoundary ? true : false : (workInProgressRootRenderLanes & 62914560) === workInProgressRootRenderLanes || 0 !== (workInProgressRootRenderLanes & 536870912) ? handler === shellBoundary : false;
      }
      function pushDispatcher() {
        var prevDispatcher = ReactSharedInternals.H;
        ReactSharedInternals.H = ContextOnlyDispatcher;
        return null === prevDispatcher ? ContextOnlyDispatcher : prevDispatcher;
      }
      function pushAsyncDispatcher() {
        var prevAsyncDispatcher = ReactSharedInternals.A;
        ReactSharedInternals.A = DefaultAsyncDispatcher;
        return prevAsyncDispatcher;
      }
      function renderDidSuspendDelayIfPossible() {
        workInProgressRootExitStatus = 4;
        workInProgressRootDidSkipSuspendedSiblings || (workInProgressRootRenderLanes & 4194048) !== workInProgressRootRenderLanes && null !== suspenseHandlerStackCursor.current || (workInProgressRootIsPrerendering = true);
        0 === (workInProgressRootSkippedLanes & 134217727) && 0 === (workInProgressRootInterleavedUpdatedLanes & 134217727) || null === workInProgressRoot || markRootSuspended(
          workInProgressRoot,
          workInProgressRootRenderLanes,
          workInProgressDeferredLane,
          false
        );
      }
      function renderRootSync(root2, lanes, shouldYieldForPrerendering) {
        var prevExecutionContext = executionContext;
        executionContext |= 2;
        var prevDispatcher = pushDispatcher(), prevAsyncDispatcher = pushAsyncDispatcher();
        if (workInProgressRoot !== root2 || workInProgressRootRenderLanes !== lanes)
          workInProgressTransitions = null, prepareFreshStack(root2, lanes);
        lanes = false;
        var exitStatus = workInProgressRootExitStatus;
        a: do
          try {
            if (0 !== workInProgressSuspendedReason && null !== workInProgress) {
              var unitOfWork = workInProgress, thrownValue = workInProgressThrownValue;
              switch (workInProgressSuspendedReason) {
                case 8:
                  resetWorkInProgressStack();
                  exitStatus = 6;
                  break a;
                case 3:
                case 2:
                case 9:
                case 6:
                  null === suspenseHandlerStackCursor.current && (lanes = true);
                  var reason = workInProgressSuspendedReason;
                  workInProgressSuspendedReason = 0;
                  workInProgressThrownValue = null;
                  throwAndUnwindWorkLoop(root2, unitOfWork, thrownValue, reason);
                  if (shouldYieldForPrerendering && workInProgressRootIsPrerendering) {
                    exitStatus = 0;
                    break a;
                  }
                  break;
                default:
                  reason = workInProgressSuspendedReason, workInProgressSuspendedReason = 0, workInProgressThrownValue = null, throwAndUnwindWorkLoop(root2, unitOfWork, thrownValue, reason);
              }
            }
            workLoopSync();
            exitStatus = workInProgressRootExitStatus;
            break;
          } catch (thrownValue$165) {
            handleThrow(root2, thrownValue$165);
          }
        while (1);
        lanes && root2.shellSuspendCounter++;
        lastContextDependency = currentlyRenderingFiber$1 = null;
        executionContext = prevExecutionContext;
        ReactSharedInternals.H = prevDispatcher;
        ReactSharedInternals.A = prevAsyncDispatcher;
        null === workInProgress && (workInProgressRoot = null, workInProgressRootRenderLanes = 0, finishQueueingConcurrentUpdates());
        return exitStatus;
      }
      function workLoopSync() {
        for (; null !== workInProgress; ) performUnitOfWork(workInProgress);
      }
      function renderRootConcurrent(root2, lanes) {
        var prevExecutionContext = executionContext;
        executionContext |= 2;
        var prevDispatcher = pushDispatcher(), prevAsyncDispatcher = pushAsyncDispatcher();
        workInProgressRoot !== root2 || workInProgressRootRenderLanes !== lanes ? (workInProgressTransitions = null, workInProgressRootRenderTargetTime = now() + 500, prepareFreshStack(root2, lanes)) : workInProgressRootIsPrerendering = checkIfRootIsPrerendering(
          root2,
          lanes
        );
        a: do
          try {
            if (0 !== workInProgressSuspendedReason && null !== workInProgress) {
              lanes = workInProgress;
              var thrownValue = workInProgressThrownValue;
              b: switch (workInProgressSuspendedReason) {
                case 1:
                  workInProgressSuspendedReason = 0;
                  workInProgressThrownValue = null;
                  throwAndUnwindWorkLoop(root2, lanes, thrownValue, 1);
                  break;
                case 2:
                case 9:
                  if (isThenableResolved(thrownValue)) {
                    workInProgressSuspendedReason = 0;
                    workInProgressThrownValue = null;
                    replaySuspendedUnitOfWork(lanes);
                    break;
                  }
                  lanes = function() {
                    2 !== workInProgressSuspendedReason && 9 !== workInProgressSuspendedReason || workInProgressRoot !== root2 || (workInProgressSuspendedReason = 7);
                    ensureRootIsScheduled(root2);
                  };
                  thrownValue.then(lanes, lanes);
                  break a;
                case 3:
                  workInProgressSuspendedReason = 7;
                  break a;
                case 4:
                  workInProgressSuspendedReason = 5;
                  break a;
                case 7:
                  isThenableResolved(thrownValue) ? (workInProgressSuspendedReason = 0, workInProgressThrownValue = null, replaySuspendedUnitOfWork(lanes)) : (workInProgressSuspendedReason = 0, workInProgressThrownValue = null, throwAndUnwindWorkLoop(root2, lanes, thrownValue, 7));
                  break;
                case 5:
                  var resource = null;
                  switch (workInProgress.tag) {
                    case 26:
                      resource = workInProgress.memoizedState;
                    case 5:
                    case 27:
                      var hostFiber = workInProgress;
                      if (resource ? preloadResource(resource) : hostFiber.stateNode.complete) {
                        workInProgressSuspendedReason = 0;
                        workInProgressThrownValue = null;
                        var sibling = hostFiber.sibling;
                        if (null !== sibling) workInProgress = sibling;
                        else {
                          var returnFiber = hostFiber.return;
                          null !== returnFiber ? (workInProgress = returnFiber, completeUnitOfWork(returnFiber)) : workInProgress = null;
                        }
                        break b;
                      }
                  }
                  workInProgressSuspendedReason = 0;
                  workInProgressThrownValue = null;
                  throwAndUnwindWorkLoop(root2, lanes, thrownValue, 5);
                  break;
                case 6:
                  workInProgressSuspendedReason = 0;
                  workInProgressThrownValue = null;
                  throwAndUnwindWorkLoop(root2, lanes, thrownValue, 6);
                  break;
                case 8:
                  resetWorkInProgressStack();
                  workInProgressRootExitStatus = 6;
                  break a;
                default:
                  throw Error(formatProdErrorMessage(462));
              }
            }
            workLoopConcurrentByScheduler();
            break;
          } catch (thrownValue$167) {
            handleThrow(root2, thrownValue$167);
          }
        while (1);
        lastContextDependency = currentlyRenderingFiber$1 = null;
        ReactSharedInternals.H = prevDispatcher;
        ReactSharedInternals.A = prevAsyncDispatcher;
        executionContext = prevExecutionContext;
        if (null !== workInProgress) return 0;
        workInProgressRoot = null;
        workInProgressRootRenderLanes = 0;
        finishQueueingConcurrentUpdates();
        return workInProgressRootExitStatus;
      }
      function workLoopConcurrentByScheduler() {
        for (; null !== workInProgress && !shouldYield(); )
          performUnitOfWork(workInProgress);
      }
      function performUnitOfWork(unitOfWork) {
        var next = beginWork(unitOfWork.alternate, unitOfWork, entangledRenderLanes);
        unitOfWork.memoizedProps = unitOfWork.pendingProps;
        null === next ? completeUnitOfWork(unitOfWork) : workInProgress = next;
      }
      function replaySuspendedUnitOfWork(unitOfWork) {
        var next = unitOfWork;
        var current = next.alternate;
        switch (next.tag) {
          case 15:
          case 0:
            next = replayFunctionComponent(
              current,
              next,
              next.pendingProps,
              next.type,
              void 0,
              workInProgressRootRenderLanes
            );
            break;
          case 11:
            next = replayFunctionComponent(
              current,
              next,
              next.pendingProps,
              next.type.render,
              next.ref,
              workInProgressRootRenderLanes
            );
            break;
          case 5:
            resetHooksOnUnwind(next);
          default:
            unwindInterruptedWork(current, next), next = workInProgress = resetWorkInProgress(next, entangledRenderLanes), next = beginWork(current, next, entangledRenderLanes);
        }
        unitOfWork.memoizedProps = unitOfWork.pendingProps;
        null === next ? completeUnitOfWork(unitOfWork) : workInProgress = next;
      }
      function throwAndUnwindWorkLoop(root2, unitOfWork, thrownValue, suspendedReason) {
        lastContextDependency = currentlyRenderingFiber$1 = null;
        resetHooksOnUnwind(unitOfWork);
        thenableState$1 = null;
        thenableIndexCounter$1 = 0;
        var returnFiber = unitOfWork.return;
        try {
          if (throwException(
            root2,
            returnFiber,
            unitOfWork,
            thrownValue,
            workInProgressRootRenderLanes
          )) {
            workInProgressRootExitStatus = 1;
            logUncaughtError(
              root2,
              createCapturedValueAtFiber(thrownValue, root2.current)
            );
            workInProgress = null;
            return;
          }
        } catch (error) {
          if (null !== returnFiber) throw workInProgress = returnFiber, error;
          workInProgressRootExitStatus = 1;
          logUncaughtError(
            root2,
            createCapturedValueAtFiber(thrownValue, root2.current)
          );
          workInProgress = null;
          return;
        }
        if (unitOfWork.flags & 32768) {
          if (isHydrating || 1 === suspendedReason) root2 = true;
          else if (workInProgressRootIsPrerendering || 0 !== (workInProgressRootRenderLanes & 536870912))
            root2 = false;
          else if (workInProgressRootDidSkipSuspendedSiblings = root2 = true, 2 === suspendedReason || 9 === suspendedReason || 3 === suspendedReason || 6 === suspendedReason)
            suspendedReason = suspenseHandlerStackCursor.current, null !== suspendedReason && 13 === suspendedReason.tag && (suspendedReason.flags |= 16384);
          unwindUnitOfWork(unitOfWork, root2);
        } else completeUnitOfWork(unitOfWork);
      }
      function completeUnitOfWork(unitOfWork) {
        var completedWork = unitOfWork;
        do {
          if (0 !== (completedWork.flags & 32768)) {
            unwindUnitOfWork(
              completedWork,
              workInProgressRootDidSkipSuspendedSiblings
            );
            return;
          }
          unitOfWork = completedWork.return;
          var next = completeWork(
            completedWork.alternate,
            completedWork,
            entangledRenderLanes
          );
          if (null !== next) {
            workInProgress = next;
            return;
          }
          completedWork = completedWork.sibling;
          if (null !== completedWork) {
            workInProgress = completedWork;
            return;
          }
          workInProgress = completedWork = unitOfWork;
        } while (null !== completedWork);
        0 === workInProgressRootExitStatus && (workInProgressRootExitStatus = 5);
      }
      function unwindUnitOfWork(unitOfWork, skipSiblings) {
        do {
          var next = unwindWork(unitOfWork.alternate, unitOfWork);
          if (null !== next) {
            next.flags &= 32767;
            workInProgress = next;
            return;
          }
          next = unitOfWork.return;
          null !== next && (next.flags |= 32768, next.subtreeFlags = 0, next.deletions = null);
          if (!skipSiblings && (unitOfWork = unitOfWork.sibling, null !== unitOfWork)) {
            workInProgress = unitOfWork;
            return;
          }
          workInProgress = unitOfWork = next;
        } while (null !== unitOfWork);
        workInProgressRootExitStatus = 6;
        workInProgress = null;
      }
      function commitRoot(root2, finishedWork, lanes, recoverableErrors, transitions, didIncludeRenderPhaseUpdate, spawnedLane, updatedLanes, suspendedRetryLanes) {
        root2.cancelPendingCommit = null;
        do
          flushPendingEffects();
        while (0 !== pendingEffectsStatus);
        if (0 !== (executionContext & 6)) throw Error(formatProdErrorMessage(327));
        if (null !== finishedWork) {
          if (finishedWork === root2.current) throw Error(formatProdErrorMessage(177));
          didIncludeRenderPhaseUpdate = finishedWork.lanes | finishedWork.childLanes;
          didIncludeRenderPhaseUpdate |= concurrentlyUpdatedLanes;
          markRootFinished(
            root2,
            lanes,
            didIncludeRenderPhaseUpdate,
            spawnedLane,
            updatedLanes,
            suspendedRetryLanes
          );
          root2 === workInProgressRoot && (workInProgress = workInProgressRoot = null, workInProgressRootRenderLanes = 0);
          pendingFinishedWork = finishedWork;
          pendingEffectsRoot = root2;
          pendingEffectsLanes = lanes;
          pendingEffectsRemainingLanes = didIncludeRenderPhaseUpdate;
          pendingPassiveTransitions = transitions;
          pendingRecoverableErrors = recoverableErrors;
          0 !== (finishedWork.subtreeFlags & 10256) || 0 !== (finishedWork.flags & 10256) ? (root2.callbackNode = null, root2.callbackPriority = 0, scheduleCallback$1(NormalPriority$1, function() {
            flushPassiveEffects();
            return null;
          })) : (root2.callbackNode = null, root2.callbackPriority = 0);
          recoverableErrors = 0 !== (finishedWork.flags & 13878);
          if (0 !== (finishedWork.subtreeFlags & 13878) || recoverableErrors) {
            recoverableErrors = ReactSharedInternals.T;
            ReactSharedInternals.T = null;
            transitions = ReactDOMSharedInternals.p;
            ReactDOMSharedInternals.p = 2;
            spawnedLane = executionContext;
            executionContext |= 4;
            try {
              commitBeforeMutationEffects(root2, finishedWork, lanes);
            } finally {
              executionContext = spawnedLane, ReactDOMSharedInternals.p = transitions, ReactSharedInternals.T = recoverableErrors;
            }
          }
          pendingEffectsStatus = 1;
          flushMutationEffects();
          flushLayoutEffects();
          flushSpawnedWork();
        }
      }
      function flushMutationEffects() {
        if (1 === pendingEffectsStatus) {
          pendingEffectsStatus = 0;
          var root2 = pendingEffectsRoot, finishedWork = pendingFinishedWork, rootMutationHasEffect = 0 !== (finishedWork.flags & 13878);
          if (0 !== (finishedWork.subtreeFlags & 13878) || rootMutationHasEffect) {
            rootMutationHasEffect = ReactSharedInternals.T;
            ReactSharedInternals.T = null;
            var previousPriority = ReactDOMSharedInternals.p;
            ReactDOMSharedInternals.p = 2;
            var prevExecutionContext = executionContext;
            executionContext |= 4;
            try {
              commitMutationEffectsOnFiber(finishedWork, root2);
              var priorSelectionInformation = selectionInformation, curFocusedElem = getActiveElementDeep(root2.containerInfo), priorFocusedElem = priorSelectionInformation.focusedElem, priorSelectionRange = priorSelectionInformation.selectionRange;
              if (curFocusedElem !== priorFocusedElem && priorFocusedElem && priorFocusedElem.ownerDocument && containsNode(
                priorFocusedElem.ownerDocument.documentElement,
                priorFocusedElem
              )) {
                if (null !== priorSelectionRange && hasSelectionCapabilities(priorFocusedElem)) {
                  var start = priorSelectionRange.start, end = priorSelectionRange.end;
                  void 0 === end && (end = start);
                  if ("selectionStart" in priorFocusedElem)
                    priorFocusedElem.selectionStart = start, priorFocusedElem.selectionEnd = Math.min(
                      end,
                      priorFocusedElem.value.length
                    );
                  else {
                    var doc = priorFocusedElem.ownerDocument || document, win = doc && doc.defaultView || window;
                    if (win.getSelection) {
                      var selection = win.getSelection(), length = priorFocusedElem.textContent.length, start$jscomp$0 = Math.min(priorSelectionRange.start, length), end$jscomp$0 = void 0 === priorSelectionRange.end ? start$jscomp$0 : Math.min(priorSelectionRange.end, length);
                      !selection.extend && start$jscomp$0 > end$jscomp$0 && (curFocusedElem = end$jscomp$0, end$jscomp$0 = start$jscomp$0, start$jscomp$0 = curFocusedElem);
                      var startMarker = getNodeForCharacterOffset(
                        priorFocusedElem,
                        start$jscomp$0
                      ), endMarker = getNodeForCharacterOffset(
                        priorFocusedElem,
                        end$jscomp$0
                      );
                      if (startMarker && endMarker && (1 !== selection.rangeCount || selection.anchorNode !== startMarker.node || selection.anchorOffset !== startMarker.offset || selection.focusNode !== endMarker.node || selection.focusOffset !== endMarker.offset)) {
                        var range = doc.createRange();
                        range.setStart(startMarker.node, startMarker.offset);
                        selection.removeAllRanges();
                        start$jscomp$0 > end$jscomp$0 ? (selection.addRange(range), selection.extend(endMarker.node, endMarker.offset)) : (range.setEnd(endMarker.node, endMarker.offset), selection.addRange(range));
                      }
                    }
                  }
                }
                doc = [];
                for (selection = priorFocusedElem; selection = selection.parentNode; )
                  1 === selection.nodeType && doc.push({
                    element: selection,
                    left: selection.scrollLeft,
                    top: selection.scrollTop
                  });
                "function" === typeof priorFocusedElem.focus && priorFocusedElem.focus();
                for (priorFocusedElem = 0; priorFocusedElem < doc.length; priorFocusedElem++) {
                  var info = doc[priorFocusedElem];
                  info.element.scrollLeft = info.left;
                  info.element.scrollTop = info.top;
                }
              }
              _enabled = !!eventsEnabled;
              selectionInformation = eventsEnabled = null;
            } finally {
              executionContext = prevExecutionContext, ReactDOMSharedInternals.p = previousPriority, ReactSharedInternals.T = rootMutationHasEffect;
            }
          }
          root2.current = finishedWork;
          pendingEffectsStatus = 2;
        }
      }
      function flushLayoutEffects() {
        if (2 === pendingEffectsStatus) {
          pendingEffectsStatus = 0;
          var root2 = pendingEffectsRoot, finishedWork = pendingFinishedWork, rootHasLayoutEffect = 0 !== (finishedWork.flags & 8772);
          if (0 !== (finishedWork.subtreeFlags & 8772) || rootHasLayoutEffect) {
            rootHasLayoutEffect = ReactSharedInternals.T;
            ReactSharedInternals.T = null;
            var previousPriority = ReactDOMSharedInternals.p;
            ReactDOMSharedInternals.p = 2;
            var prevExecutionContext = executionContext;
            executionContext |= 4;
            try {
              commitLayoutEffectOnFiber(root2, finishedWork.alternate, finishedWork);
            } finally {
              executionContext = prevExecutionContext, ReactDOMSharedInternals.p = previousPriority, ReactSharedInternals.T = rootHasLayoutEffect;
            }
          }
          pendingEffectsStatus = 3;
        }
      }
      function flushSpawnedWork() {
        if (4 === pendingEffectsStatus || 3 === pendingEffectsStatus) {
          pendingEffectsStatus = 0;
          requestPaint();
          var root2 = pendingEffectsRoot, finishedWork = pendingFinishedWork, lanes = pendingEffectsLanes, recoverableErrors = pendingRecoverableErrors;
          0 !== (finishedWork.subtreeFlags & 10256) || 0 !== (finishedWork.flags & 10256) ? pendingEffectsStatus = 5 : (pendingEffectsStatus = 0, pendingFinishedWork = pendingEffectsRoot = null, releaseRootPooledCache(root2, root2.pendingLanes));
          var remainingLanes = root2.pendingLanes;
          0 === remainingLanes && (legacyErrorBoundariesThatAlreadyFailed = null);
          lanesToEventPriority(lanes);
          finishedWork = finishedWork.stateNode;
          if (injectedHook && "function" === typeof injectedHook.onCommitFiberRoot)
            try {
              injectedHook.onCommitFiberRoot(
                rendererID,
                finishedWork,
                void 0,
                128 === (finishedWork.current.flags & 128)
              );
            } catch (err) {
            }
          if (null !== recoverableErrors) {
            finishedWork = ReactSharedInternals.T;
            remainingLanes = ReactDOMSharedInternals.p;
            ReactDOMSharedInternals.p = 2;
            ReactSharedInternals.T = null;
            try {
              for (var onRecoverableError = root2.onRecoverableError, i = 0; i < recoverableErrors.length; i++) {
                var recoverableError = recoverableErrors[i];
                onRecoverableError(recoverableError.value, {
                  componentStack: recoverableError.stack
                });
              }
            } finally {
              ReactSharedInternals.T = finishedWork, ReactDOMSharedInternals.p = remainingLanes;
            }
          }
          0 !== (pendingEffectsLanes & 3) && flushPendingEffects();
          ensureRootIsScheduled(root2);
          remainingLanes = root2.pendingLanes;
          0 !== (lanes & 261930) && 0 !== (remainingLanes & 42) ? root2 === rootWithNestedUpdates ? nestedUpdateCount++ : (nestedUpdateCount = 0, rootWithNestedUpdates = root2) : nestedUpdateCount = 0;
          flushSyncWorkAcrossRoots_impl(0, false);
        }
      }
      function releaseRootPooledCache(root2, remainingLanes) {
        0 === (root2.pooledCacheLanes &= remainingLanes) && (remainingLanes = root2.pooledCache, null != remainingLanes && (root2.pooledCache = null, releaseCache(remainingLanes)));
      }
      function flushPendingEffects() {
        flushMutationEffects();
        flushLayoutEffects();
        flushSpawnedWork();
        return flushPassiveEffects();
      }
      function flushPassiveEffects() {
        if (5 !== pendingEffectsStatus) return false;
        var root2 = pendingEffectsRoot, remainingLanes = pendingEffectsRemainingLanes;
        pendingEffectsRemainingLanes = 0;
        var renderPriority = lanesToEventPriority(pendingEffectsLanes), prevTransition = ReactSharedInternals.T, previousPriority = ReactDOMSharedInternals.p;
        try {
          ReactDOMSharedInternals.p = 32 > renderPriority ? 32 : renderPriority;
          ReactSharedInternals.T = null;
          renderPriority = pendingPassiveTransitions;
          pendingPassiveTransitions = null;
          var root$jscomp$0 = pendingEffectsRoot, lanes = pendingEffectsLanes;
          pendingEffectsStatus = 0;
          pendingFinishedWork = pendingEffectsRoot = null;
          pendingEffectsLanes = 0;
          if (0 !== (executionContext & 6)) throw Error(formatProdErrorMessage(331));
          var prevExecutionContext = executionContext;
          executionContext |= 4;
          commitPassiveUnmountOnFiber(root$jscomp$0.current);
          commitPassiveMountOnFiber(
            root$jscomp$0,
            root$jscomp$0.current,
            lanes,
            renderPriority
          );
          executionContext = prevExecutionContext;
          flushSyncWorkAcrossRoots_impl(0, false);
          if (injectedHook && "function" === typeof injectedHook.onPostCommitFiberRoot)
            try {
              injectedHook.onPostCommitFiberRoot(rendererID, root$jscomp$0);
            } catch (err) {
            }
          return true;
        } finally {
          ReactDOMSharedInternals.p = previousPriority, ReactSharedInternals.T = prevTransition, releaseRootPooledCache(root2, remainingLanes);
        }
      }
      function captureCommitPhaseErrorOnRoot(rootFiber, sourceFiber, error) {
        sourceFiber = createCapturedValueAtFiber(error, sourceFiber);
        sourceFiber = createRootErrorUpdate(rootFiber.stateNode, sourceFiber, 2);
        rootFiber = enqueueUpdate(rootFiber, sourceFiber, 2);
        null !== rootFiber && (markRootUpdated$1(rootFiber, 2), ensureRootIsScheduled(rootFiber));
      }
      function captureCommitPhaseError(sourceFiber, nearestMountedAncestor, error) {
        if (3 === sourceFiber.tag)
          captureCommitPhaseErrorOnRoot(sourceFiber, sourceFiber, error);
        else
          for (; null !== nearestMountedAncestor; ) {
            if (3 === nearestMountedAncestor.tag) {
              captureCommitPhaseErrorOnRoot(
                nearestMountedAncestor,
                sourceFiber,
                error
              );
              break;
            } else if (1 === nearestMountedAncestor.tag) {
              var instance = nearestMountedAncestor.stateNode;
              if ("function" === typeof nearestMountedAncestor.type.getDerivedStateFromError || "function" === typeof instance.componentDidCatch && (null === legacyErrorBoundariesThatAlreadyFailed || !legacyErrorBoundariesThatAlreadyFailed.has(instance))) {
                sourceFiber = createCapturedValueAtFiber(error, sourceFiber);
                error = createClassErrorUpdate(2);
                instance = enqueueUpdate(nearestMountedAncestor, error, 2);
                null !== instance && (initializeClassErrorUpdate(
                  error,
                  instance,
                  nearestMountedAncestor,
                  sourceFiber
                ), markRootUpdated$1(instance, 2), ensureRootIsScheduled(instance));
                break;
              }
            }
            nearestMountedAncestor = nearestMountedAncestor.return;
          }
      }
      function attachPingListener(root2, wakeable, lanes) {
        var pingCache = root2.pingCache;
        if (null === pingCache) {
          pingCache = root2.pingCache = new PossiblyWeakMap();
          var threadIDs = /* @__PURE__ */ new Set();
          pingCache.set(wakeable, threadIDs);
        } else
          threadIDs = pingCache.get(wakeable), void 0 === threadIDs && (threadIDs = /* @__PURE__ */ new Set(), pingCache.set(wakeable, threadIDs));
        threadIDs.has(lanes) || (workInProgressRootDidAttachPingListener = true, threadIDs.add(lanes), root2 = pingSuspendedRoot.bind(null, root2, wakeable, lanes), wakeable.then(root2, root2));
      }
      function pingSuspendedRoot(root2, wakeable, pingedLanes) {
        var pingCache = root2.pingCache;
        null !== pingCache && pingCache.delete(wakeable);
        root2.pingedLanes |= root2.suspendedLanes & pingedLanes;
        root2.warmLanes &= ~pingedLanes;
        workInProgressRoot === root2 && (workInProgressRootRenderLanes & pingedLanes) === pingedLanes && (4 === workInProgressRootExitStatus || 3 === workInProgressRootExitStatus && (workInProgressRootRenderLanes & 62914560) === workInProgressRootRenderLanes && 300 > now() - globalMostRecentFallbackTime ? 0 === (executionContext & 2) && prepareFreshStack(root2, 0) : workInProgressRootPingedLanes |= pingedLanes, workInProgressSuspendedRetryLanes === workInProgressRootRenderLanes && (workInProgressSuspendedRetryLanes = 0));
        ensureRootIsScheduled(root2);
      }
      function retryTimedOutBoundary(boundaryFiber, retryLane) {
        0 === retryLane && (retryLane = claimNextRetryLane());
        boundaryFiber = enqueueConcurrentRenderForLane(boundaryFiber, retryLane);
        null !== boundaryFiber && (markRootUpdated$1(boundaryFiber, retryLane), ensureRootIsScheduled(boundaryFiber));
      }
      function retryDehydratedSuspenseBoundary(boundaryFiber) {
        var suspenseState = boundaryFiber.memoizedState, retryLane = 0;
        null !== suspenseState && (retryLane = suspenseState.retryLane);
        retryTimedOutBoundary(boundaryFiber, retryLane);
      }
      function resolveRetryWakeable(boundaryFiber, wakeable) {
        var retryLane = 0;
        switch (boundaryFiber.tag) {
          case 31:
          case 13:
            var retryCache = boundaryFiber.stateNode;
            var suspenseState = boundaryFiber.memoizedState;
            null !== suspenseState && (retryLane = suspenseState.retryLane);
            break;
          case 19:
            retryCache = boundaryFiber.stateNode;
            break;
          case 22:
            retryCache = boundaryFiber.stateNode._retryCache;
            break;
          default:
            throw Error(formatProdErrorMessage(314));
        }
        null !== retryCache && retryCache.delete(wakeable);
        retryTimedOutBoundary(boundaryFiber, retryLane);
      }
      function scheduleCallback$1(priorityLevel, callback) {
        return scheduleCallback$3(priorityLevel, callback);
      }
      var firstScheduledRoot = null;
      var lastScheduledRoot = null;
      var didScheduleMicrotask = false;
      var mightHavePendingSyncWork = false;
      var isFlushingWork = false;
      var currentEventTransitionLane = 0;
      function ensureRootIsScheduled(root2) {
        root2 !== lastScheduledRoot && null === root2.next && (null === lastScheduledRoot ? firstScheduledRoot = lastScheduledRoot = root2 : lastScheduledRoot = lastScheduledRoot.next = root2);
        mightHavePendingSyncWork = true;
        didScheduleMicrotask || (didScheduleMicrotask = true, scheduleImmediateRootScheduleTask());
      }
      function flushSyncWorkAcrossRoots_impl(syncTransitionLanes, onlyLegacy) {
        if (!isFlushingWork && mightHavePendingSyncWork) {
          isFlushingWork = true;
          do {
            var didPerformSomeWork = false;
            for (var root$170 = firstScheduledRoot; null !== root$170; ) {
              if (!onlyLegacy)
                if (0 !== syncTransitionLanes) {
                  var pendingLanes = root$170.pendingLanes;
                  if (0 === pendingLanes) var JSCompiler_inline_result = 0;
                  else {
                    var suspendedLanes = root$170.suspendedLanes, pingedLanes = root$170.pingedLanes;
                    JSCompiler_inline_result = (1 << 31 - clz32(42 | syncTransitionLanes) + 1) - 1;
                    JSCompiler_inline_result &= pendingLanes & ~(suspendedLanes & ~pingedLanes);
                    JSCompiler_inline_result = JSCompiler_inline_result & 201326741 ? JSCompiler_inline_result & 201326741 | 1 : JSCompiler_inline_result ? JSCompiler_inline_result | 2 : 0;
                  }
                  0 !== JSCompiler_inline_result && (didPerformSomeWork = true, performSyncWorkOnRoot(root$170, JSCompiler_inline_result));
                } else
                  JSCompiler_inline_result = workInProgressRootRenderLanes, JSCompiler_inline_result = getNextLanes(
                    root$170,
                    root$170 === workInProgressRoot ? JSCompiler_inline_result : 0,
                    null !== root$170.cancelPendingCommit || -1 !== root$170.timeoutHandle
                  ), 0 === (JSCompiler_inline_result & 3) || checkIfRootIsPrerendering(root$170, JSCompiler_inline_result) || (didPerformSomeWork = true, performSyncWorkOnRoot(root$170, JSCompiler_inline_result));
              root$170 = root$170.next;
            }
          } while (didPerformSomeWork);
          isFlushingWork = false;
        }
      }
      function processRootScheduleInImmediateTask() {
        processRootScheduleInMicrotask();
      }
      function processRootScheduleInMicrotask() {
        mightHavePendingSyncWork = didScheduleMicrotask = false;
        var syncTransitionLanes = 0;
        0 !== currentEventTransitionLane && shouldAttemptEagerTransition() && (syncTransitionLanes = currentEventTransitionLane);
        for (var currentTime = now(), prev = null, root2 = firstScheduledRoot; null !== root2; ) {
          var next = root2.next, nextLanes = scheduleTaskForRootDuringMicrotask(root2, currentTime);
          if (0 === nextLanes)
            root2.next = null, null === prev ? firstScheduledRoot = next : prev.next = next, null === next && (lastScheduledRoot = prev);
          else if (prev = root2, 0 !== syncTransitionLanes || 0 !== (nextLanes & 3))
            mightHavePendingSyncWork = true;
          root2 = next;
        }
        0 !== pendingEffectsStatus && 5 !== pendingEffectsStatus || flushSyncWorkAcrossRoots_impl(syncTransitionLanes, false);
        0 !== currentEventTransitionLane && (currentEventTransitionLane = 0);
      }
      function scheduleTaskForRootDuringMicrotask(root2, currentTime) {
        for (var suspendedLanes = root2.suspendedLanes, pingedLanes = root2.pingedLanes, expirationTimes = root2.expirationTimes, lanes = root2.pendingLanes & -62914561; 0 < lanes; ) {
          var index$5 = 31 - clz32(lanes), lane = 1 << index$5, expirationTime = expirationTimes[index$5];
          if (-1 === expirationTime) {
            if (0 === (lane & suspendedLanes) || 0 !== (lane & pingedLanes))
              expirationTimes[index$5] = computeExpirationTime(lane, currentTime);
          } else expirationTime <= currentTime && (root2.expiredLanes |= lane);
          lanes &= ~lane;
        }
        currentTime = workInProgressRoot;
        suspendedLanes = workInProgressRootRenderLanes;
        suspendedLanes = getNextLanes(
          root2,
          root2 === currentTime ? suspendedLanes : 0,
          null !== root2.cancelPendingCommit || -1 !== root2.timeoutHandle
        );
        pingedLanes = root2.callbackNode;
        if (0 === suspendedLanes || root2 === currentTime && (2 === workInProgressSuspendedReason || 9 === workInProgressSuspendedReason) || null !== root2.cancelPendingCommit)
          return null !== pingedLanes && null !== pingedLanes && cancelCallback$1(pingedLanes), root2.callbackNode = null, root2.callbackPriority = 0;
        if (0 === (suspendedLanes & 3) || checkIfRootIsPrerendering(root2, suspendedLanes)) {
          currentTime = suspendedLanes & -suspendedLanes;
          if (currentTime === root2.callbackPriority) return currentTime;
          null !== pingedLanes && cancelCallback$1(pingedLanes);
          switch (lanesToEventPriority(suspendedLanes)) {
            case 2:
            case 8:
              suspendedLanes = UserBlockingPriority;
              break;
            case 32:
              suspendedLanes = NormalPriority$1;
              break;
            case 268435456:
              suspendedLanes = IdlePriority;
              break;
            default:
              suspendedLanes = NormalPriority$1;
          }
          pingedLanes = performWorkOnRootViaSchedulerTask.bind(null, root2);
          suspendedLanes = scheduleCallback$3(suspendedLanes, pingedLanes);
          root2.callbackPriority = currentTime;
          root2.callbackNode = suspendedLanes;
          return currentTime;
        }
        null !== pingedLanes && null !== pingedLanes && cancelCallback$1(pingedLanes);
        root2.callbackPriority = 2;
        root2.callbackNode = null;
        return 2;
      }
      function performWorkOnRootViaSchedulerTask(root2, didTimeout) {
        if (0 !== pendingEffectsStatus && 5 !== pendingEffectsStatus)
          return root2.callbackNode = null, root2.callbackPriority = 0, null;
        var originalCallbackNode = root2.callbackNode;
        if (flushPendingEffects() && root2.callbackNode !== originalCallbackNode)
          return null;
        var workInProgressRootRenderLanes$jscomp$0 = workInProgressRootRenderLanes;
        workInProgressRootRenderLanes$jscomp$0 = getNextLanes(
          root2,
          root2 === workInProgressRoot ? workInProgressRootRenderLanes$jscomp$0 : 0,
          null !== root2.cancelPendingCommit || -1 !== root2.timeoutHandle
        );
        if (0 === workInProgressRootRenderLanes$jscomp$0) return null;
        performWorkOnRoot(root2, workInProgressRootRenderLanes$jscomp$0, didTimeout);
        scheduleTaskForRootDuringMicrotask(root2, now());
        return null != root2.callbackNode && root2.callbackNode === originalCallbackNode ? performWorkOnRootViaSchedulerTask.bind(null, root2) : null;
      }
      function performSyncWorkOnRoot(root2, lanes) {
        if (flushPendingEffects()) return null;
        performWorkOnRoot(root2, lanes, true);
      }
      function scheduleImmediateRootScheduleTask() {
        scheduleMicrotask(function() {
          0 !== (executionContext & 6) ? scheduleCallback$3(
            ImmediatePriority,
            processRootScheduleInImmediateTask
          ) : processRootScheduleInMicrotask();
        });
      }
      function requestTransitionLane() {
        if (0 === currentEventTransitionLane) {
          var actionScopeLane = currentEntangledLane;
          0 === actionScopeLane && (actionScopeLane = nextTransitionUpdateLane, nextTransitionUpdateLane <<= 1, 0 === (nextTransitionUpdateLane & 261888) && (nextTransitionUpdateLane = 256));
          currentEventTransitionLane = actionScopeLane;
        }
        return currentEventTransitionLane;
      }
      function coerceFormActionProp(actionProp) {
        return null == actionProp || "symbol" === typeof actionProp || "boolean" === typeof actionProp ? null : "function" === typeof actionProp ? actionProp : sanitizeURL("" + actionProp);
      }
      function createFormDataWithSubmitter(form, submitter) {
        var temp = submitter.ownerDocument.createElement("input");
        temp.name = submitter.name;
        temp.value = submitter.value;
        form.id && temp.setAttribute("form", form.id);
        submitter.parentNode.insertBefore(temp, submitter);
        form = new FormData(form);
        temp.parentNode.removeChild(temp);
        return form;
      }
      function extractEvents$1(dispatchQueue, domEventName, maybeTargetInst, nativeEvent, nativeEventTarget) {
        if ("submit" === domEventName && maybeTargetInst && maybeTargetInst.stateNode === nativeEventTarget) {
          var action = coerceFormActionProp(
            (nativeEventTarget[internalPropsKey] || null).action
          ), submitter = nativeEvent.submitter;
          submitter && (domEventName = (domEventName = submitter[internalPropsKey] || null) ? coerceFormActionProp(domEventName.formAction) : submitter.getAttribute("formAction"), null !== domEventName && (action = domEventName, submitter = null));
          var event = new SyntheticEvent(
            "action",
            "action",
            null,
            nativeEvent,
            nativeEventTarget
          );
          dispatchQueue.push({
            event,
            listeners: [
              {
                instance: null,
                listener: function() {
                  if (nativeEvent.defaultPrevented) {
                    if (0 !== currentEventTransitionLane) {
                      var formData = submitter ? createFormDataWithSubmitter(nativeEventTarget, submitter) : new FormData(nativeEventTarget);
                      startHostTransition(
                        maybeTargetInst,
                        {
                          pending: true,
                          data: formData,
                          method: nativeEventTarget.method,
                          action
                        },
                        null,
                        formData
                      );
                    }
                  } else
                    "function" === typeof action && (event.preventDefault(), formData = submitter ? createFormDataWithSubmitter(nativeEventTarget, submitter) : new FormData(nativeEventTarget), startHostTransition(
                      maybeTargetInst,
                      {
                        pending: true,
                        data: formData,
                        method: nativeEventTarget.method,
                        action
                      },
                      action,
                      formData
                    ));
                },
                currentTarget: nativeEventTarget
              }
            ]
          });
        }
      }
      for (i$jscomp$inline_1577 = 0; i$jscomp$inline_1577 < simpleEventPluginEvents.length; i$jscomp$inline_1577++) {
        eventName$jscomp$inline_1578 = simpleEventPluginEvents[i$jscomp$inline_1577], domEventName$jscomp$inline_1579 = eventName$jscomp$inline_1578.toLowerCase(), capitalizedEvent$jscomp$inline_1580 = eventName$jscomp$inline_1578[0].toUpperCase() + eventName$jscomp$inline_1578.slice(1);
        registerSimpleEvent(
          domEventName$jscomp$inline_1579,
          "on" + capitalizedEvent$jscomp$inline_1580
        );
      }
      var eventName$jscomp$inline_1578;
      var domEventName$jscomp$inline_1579;
      var capitalizedEvent$jscomp$inline_1580;
      var i$jscomp$inline_1577;
      registerSimpleEvent(ANIMATION_END, "onAnimationEnd");
      registerSimpleEvent(ANIMATION_ITERATION, "onAnimationIteration");
      registerSimpleEvent(ANIMATION_START, "onAnimationStart");
      registerSimpleEvent("dblclick", "onDoubleClick");
      registerSimpleEvent("focusin", "onFocus");
      registerSimpleEvent("focusout", "onBlur");
      registerSimpleEvent(TRANSITION_RUN, "onTransitionRun");
      registerSimpleEvent(TRANSITION_START, "onTransitionStart");
      registerSimpleEvent(TRANSITION_CANCEL, "onTransitionCancel");
      registerSimpleEvent(TRANSITION_END, "onTransitionEnd");
      registerDirectEvent("onMouseEnter", ["mouseout", "mouseover"]);
      registerDirectEvent("onMouseLeave", ["mouseout", "mouseover"]);
      registerDirectEvent("onPointerEnter", ["pointerout", "pointerover"]);
      registerDirectEvent("onPointerLeave", ["pointerout", "pointerover"]);
      registerTwoPhaseEvent(
        "onChange",
        "change click focusin focusout input keydown keyup selectionchange".split(" ")
      );
      registerTwoPhaseEvent(
        "onSelect",
        "focusout contextmenu dragend focusin keydown keyup mousedown mouseup selectionchange".split(
          " "
        )
      );
      registerTwoPhaseEvent("onBeforeInput", [
        "compositionend",
        "keypress",
        "textInput",
        "paste"
      ]);
      registerTwoPhaseEvent(
        "onCompositionEnd",
        "compositionend focusout keydown keypress keyup mousedown".split(" ")
      );
      registerTwoPhaseEvent(
        "onCompositionStart",
        "compositionstart focusout keydown keypress keyup mousedown".split(" ")
      );
      registerTwoPhaseEvent(
        "onCompositionUpdate",
        "compositionupdate focusout keydown keypress keyup mousedown".split(" ")
      );
      var mediaEventTypes = "abort canplay canplaythrough durationchange emptied encrypted ended error loadeddata loadedmetadata loadstart pause play playing progress ratechange resize seeked seeking stalled suspend timeupdate volumechange waiting".split(
        " "
      );
      var nonDelegatedEvents = new Set(
        "beforetoggle cancel close invalid load scroll scrollend toggle".split(" ").concat(mediaEventTypes)
      );
      function processDispatchQueue(dispatchQueue, eventSystemFlags) {
        eventSystemFlags = 0 !== (eventSystemFlags & 4);
        for (var i = 0; i < dispatchQueue.length; i++) {
          var _dispatchQueue$i = dispatchQueue[i], event = _dispatchQueue$i.event;
          _dispatchQueue$i = _dispatchQueue$i.listeners;
          a: {
            var previousInstance = void 0;
            if (eventSystemFlags)
              for (var i$jscomp$0 = _dispatchQueue$i.length - 1; 0 <= i$jscomp$0; i$jscomp$0--) {
                var _dispatchListeners$i = _dispatchQueue$i[i$jscomp$0], instance = _dispatchListeners$i.instance, currentTarget = _dispatchListeners$i.currentTarget;
                _dispatchListeners$i = _dispatchListeners$i.listener;
                if (instance !== previousInstance && event.isPropagationStopped())
                  break a;
                previousInstance = _dispatchListeners$i;
                event.currentTarget = currentTarget;
                try {
                  previousInstance(event);
                } catch (error) {
                  reportGlobalError(error);
                }
                event.currentTarget = null;
                previousInstance = instance;
              }
            else
              for (i$jscomp$0 = 0; i$jscomp$0 < _dispatchQueue$i.length; i$jscomp$0++) {
                _dispatchListeners$i = _dispatchQueue$i[i$jscomp$0];
                instance = _dispatchListeners$i.instance;
                currentTarget = _dispatchListeners$i.currentTarget;
                _dispatchListeners$i = _dispatchListeners$i.listener;
                if (instance !== previousInstance && event.isPropagationStopped())
                  break a;
                previousInstance = _dispatchListeners$i;
                event.currentTarget = currentTarget;
                try {
                  previousInstance(event);
                } catch (error) {
                  reportGlobalError(error);
                }
                event.currentTarget = null;
                previousInstance = instance;
              }
          }
        }
      }
      function listenToNonDelegatedEvent(domEventName, targetElement) {
        var JSCompiler_inline_result = targetElement[internalEventHandlersKey];
        void 0 === JSCompiler_inline_result && (JSCompiler_inline_result = targetElement[internalEventHandlersKey] = /* @__PURE__ */ new Set());
        var listenerSetKey = domEventName + "__bubble";
        JSCompiler_inline_result.has(listenerSetKey) || (addTrappedEventListener(targetElement, domEventName, 2, false), JSCompiler_inline_result.add(listenerSetKey));
      }
      function listenToNativeEvent(domEventName, isCapturePhaseListener, target) {
        var eventSystemFlags = 0;
        isCapturePhaseListener && (eventSystemFlags |= 4);
        addTrappedEventListener(
          target,
          domEventName,
          eventSystemFlags,
          isCapturePhaseListener
        );
      }
      var listeningMarker = "_reactListening" + Math.random().toString(36).slice(2);
      function listenToAllSupportedEvents(rootContainerElement) {
        if (!rootContainerElement[listeningMarker]) {
          rootContainerElement[listeningMarker] = true;
          allNativeEvents.forEach(function(domEventName) {
            "selectionchange" !== domEventName && (nonDelegatedEvents.has(domEventName) || listenToNativeEvent(domEventName, false, rootContainerElement), listenToNativeEvent(domEventName, true, rootContainerElement));
          });
          var ownerDocument = 9 === rootContainerElement.nodeType ? rootContainerElement : rootContainerElement.ownerDocument;
          null === ownerDocument || ownerDocument[listeningMarker] || (ownerDocument[listeningMarker] = true, listenToNativeEvent("selectionchange", false, ownerDocument));
        }
      }
      function addTrappedEventListener(targetContainer, domEventName, eventSystemFlags, isCapturePhaseListener) {
        switch (getEventPriority(domEventName)) {
          case 2:
            var listenerWrapper = dispatchDiscreteEvent;
            break;
          case 8:
            listenerWrapper = dispatchContinuousEvent;
            break;
          default:
            listenerWrapper = dispatchEvent;
        }
        eventSystemFlags = listenerWrapper.bind(
          null,
          domEventName,
          eventSystemFlags,
          targetContainer
        );
        listenerWrapper = void 0;
        !passiveBrowserEventsSupported || "touchstart" !== domEventName && "touchmove" !== domEventName && "wheel" !== domEventName || (listenerWrapper = true);
        isCapturePhaseListener ? void 0 !== listenerWrapper ? targetContainer.addEventListener(domEventName, eventSystemFlags, {
          capture: true,
          passive: listenerWrapper
        }) : targetContainer.addEventListener(domEventName, eventSystemFlags, true) : void 0 !== listenerWrapper ? targetContainer.addEventListener(domEventName, eventSystemFlags, {
          passive: listenerWrapper
        }) : targetContainer.addEventListener(domEventName, eventSystemFlags, false);
      }
      function dispatchEventForPluginEventSystem(domEventName, eventSystemFlags, nativeEvent, targetInst$jscomp$0, targetContainer) {
        var ancestorInst = targetInst$jscomp$0;
        if (0 === (eventSystemFlags & 1) && 0 === (eventSystemFlags & 2) && null !== targetInst$jscomp$0)
          a: for (; ; ) {
            if (null === targetInst$jscomp$0) return;
            var nodeTag = targetInst$jscomp$0.tag;
            if (3 === nodeTag || 4 === nodeTag) {
              var container = targetInst$jscomp$0.stateNode.containerInfo;
              if (container === targetContainer) break;
              if (4 === nodeTag)
                for (nodeTag = targetInst$jscomp$0.return; null !== nodeTag; ) {
                  var grandTag = nodeTag.tag;
                  if ((3 === grandTag || 4 === grandTag) && nodeTag.stateNode.containerInfo === targetContainer)
                    return;
                  nodeTag = nodeTag.return;
                }
              for (; null !== container; ) {
                nodeTag = getClosestInstanceFromNode(container);
                if (null === nodeTag) return;
                grandTag = nodeTag.tag;
                if (5 === grandTag || 6 === grandTag || 26 === grandTag || 27 === grandTag) {
                  targetInst$jscomp$0 = ancestorInst = nodeTag;
                  continue a;
                }
                container = container.parentNode;
              }
            }
            targetInst$jscomp$0 = targetInst$jscomp$0.return;
          }
        batchedUpdates$1(function() {
          var targetInst = ancestorInst, nativeEventTarget = getEventTarget(nativeEvent), dispatchQueue = [];
          a: {
            var reactName = topLevelEventsToReactNames.get(domEventName);
            if (void 0 !== reactName) {
              var SyntheticEventCtor = SyntheticEvent, reactEventType = domEventName;
              switch (domEventName) {
                case "keypress":
                  if (0 === getEventCharCode(nativeEvent)) break a;
                case "keydown":
                case "keyup":
                  SyntheticEventCtor = SyntheticKeyboardEvent;
                  break;
                case "focusin":
                  reactEventType = "focus";
                  SyntheticEventCtor = SyntheticFocusEvent;
                  break;
                case "focusout":
                  reactEventType = "blur";
                  SyntheticEventCtor = SyntheticFocusEvent;
                  break;
                case "beforeblur":
                case "afterblur":
                  SyntheticEventCtor = SyntheticFocusEvent;
                  break;
                case "click":
                  if (2 === nativeEvent.button) break a;
                case "auxclick":
                case "dblclick":
                case "mousedown":
                case "mousemove":
                case "mouseup":
                case "mouseout":
                case "mouseover":
                case "contextmenu":
                  SyntheticEventCtor = SyntheticMouseEvent;
                  break;
                case "drag":
                case "dragend":
                case "dragenter":
                case "dragexit":
                case "dragleave":
                case "dragover":
                case "dragstart":
                case "drop":
                  SyntheticEventCtor = SyntheticDragEvent;
                  break;
                case "touchcancel":
                case "touchend":
                case "touchmove":
                case "touchstart":
                  SyntheticEventCtor = SyntheticTouchEvent;
                  break;
                case ANIMATION_END:
                case ANIMATION_ITERATION:
                case ANIMATION_START:
                  SyntheticEventCtor = SyntheticAnimationEvent;
                  break;
                case TRANSITION_END:
                  SyntheticEventCtor = SyntheticTransitionEvent;
                  break;
                case "scroll":
                case "scrollend":
                  SyntheticEventCtor = SyntheticUIEvent;
                  break;
                case "wheel":
                  SyntheticEventCtor = SyntheticWheelEvent;
                  break;
                case "copy":
                case "cut":
                case "paste":
                  SyntheticEventCtor = SyntheticClipboardEvent;
                  break;
                case "gotpointercapture":
                case "lostpointercapture":
                case "pointercancel":
                case "pointerdown":
                case "pointermove":
                case "pointerout":
                case "pointerover":
                case "pointerup":
                  SyntheticEventCtor = SyntheticPointerEvent;
                  break;
                case "toggle":
                case "beforetoggle":
                  SyntheticEventCtor = SyntheticToggleEvent;
              }
              var inCapturePhase = 0 !== (eventSystemFlags & 4), accumulateTargetOnly = !inCapturePhase && ("scroll" === domEventName || "scrollend" === domEventName), reactEventName = inCapturePhase ? null !== reactName ? reactName + "Capture" : null : reactName;
              inCapturePhase = [];
              for (var instance = targetInst, lastHostComponent; null !== instance; ) {
                var _instance = instance;
                lastHostComponent = _instance.stateNode;
                _instance = _instance.tag;
                5 !== _instance && 26 !== _instance && 27 !== _instance || null === lastHostComponent || null === reactEventName || (_instance = getListener(instance, reactEventName), null != _instance && inCapturePhase.push(
                  createDispatchListener(instance, _instance, lastHostComponent)
                ));
                if (accumulateTargetOnly) break;
                instance = instance.return;
              }
              0 < inCapturePhase.length && (reactName = new SyntheticEventCtor(
                reactName,
                reactEventType,
                null,
                nativeEvent,
                nativeEventTarget
              ), dispatchQueue.push({ event: reactName, listeners: inCapturePhase }));
            }
          }
          if (0 === (eventSystemFlags & 7)) {
            a: {
              reactName = "mouseover" === domEventName || "pointerover" === domEventName;
              SyntheticEventCtor = "mouseout" === domEventName || "pointerout" === domEventName;
              if (reactName && nativeEvent !== currentReplayingEvent && (reactEventType = nativeEvent.relatedTarget || nativeEvent.fromElement) && (getClosestInstanceFromNode(reactEventType) || reactEventType[internalContainerInstanceKey]))
                break a;
              if (SyntheticEventCtor || reactName) {
                reactName = nativeEventTarget.window === nativeEventTarget ? nativeEventTarget : (reactName = nativeEventTarget.ownerDocument) ? reactName.defaultView || reactName.parentWindow : window;
                if (SyntheticEventCtor) {
                  if (reactEventType = nativeEvent.relatedTarget || nativeEvent.toElement, SyntheticEventCtor = targetInst, reactEventType = reactEventType ? getClosestInstanceFromNode(reactEventType) : null, null !== reactEventType && (accumulateTargetOnly = getNearestMountedFiber(reactEventType), inCapturePhase = reactEventType.tag, reactEventType !== accumulateTargetOnly || 5 !== inCapturePhase && 27 !== inCapturePhase && 6 !== inCapturePhase))
                    reactEventType = null;
                } else SyntheticEventCtor = null, reactEventType = targetInst;
                if (SyntheticEventCtor !== reactEventType) {
                  inCapturePhase = SyntheticMouseEvent;
                  _instance = "onMouseLeave";
                  reactEventName = "onMouseEnter";
                  instance = "mouse";
                  if ("pointerout" === domEventName || "pointerover" === domEventName)
                    inCapturePhase = SyntheticPointerEvent, _instance = "onPointerLeave", reactEventName = "onPointerEnter", instance = "pointer";
                  accumulateTargetOnly = null == SyntheticEventCtor ? reactName : getNodeFromInstance(SyntheticEventCtor);
                  lastHostComponent = null == reactEventType ? reactName : getNodeFromInstance(reactEventType);
                  reactName = new inCapturePhase(
                    _instance,
                    instance + "leave",
                    SyntheticEventCtor,
                    nativeEvent,
                    nativeEventTarget
                  );
                  reactName.target = accumulateTargetOnly;
                  reactName.relatedTarget = lastHostComponent;
                  _instance = null;
                  getClosestInstanceFromNode(nativeEventTarget) === targetInst && (inCapturePhase = new inCapturePhase(
                    reactEventName,
                    instance + "enter",
                    reactEventType,
                    nativeEvent,
                    nativeEventTarget
                  ), inCapturePhase.target = lastHostComponent, inCapturePhase.relatedTarget = accumulateTargetOnly, _instance = inCapturePhase);
                  accumulateTargetOnly = _instance;
                  if (SyntheticEventCtor && reactEventType)
                    b: {
                      inCapturePhase = getParent;
                      reactEventName = SyntheticEventCtor;
                      instance = reactEventType;
                      lastHostComponent = 0;
                      for (_instance = reactEventName; _instance; _instance = inCapturePhase(_instance))
                        lastHostComponent++;
                      _instance = 0;
                      for (var tempB = instance; tempB; tempB = inCapturePhase(tempB))
                        _instance++;
                      for (; 0 < lastHostComponent - _instance; )
                        reactEventName = inCapturePhase(reactEventName), lastHostComponent--;
                      for (; 0 < _instance - lastHostComponent; )
                        instance = inCapturePhase(instance), _instance--;
                      for (; lastHostComponent--; ) {
                        if (reactEventName === instance || null !== instance && reactEventName === instance.alternate) {
                          inCapturePhase = reactEventName;
                          break b;
                        }
                        reactEventName = inCapturePhase(reactEventName);
                        instance = inCapturePhase(instance);
                      }
                      inCapturePhase = null;
                    }
                  else inCapturePhase = null;
                  null !== SyntheticEventCtor && accumulateEnterLeaveListenersForEvent(
                    dispatchQueue,
                    reactName,
                    SyntheticEventCtor,
                    inCapturePhase,
                    false
                  );
                  null !== reactEventType && null !== accumulateTargetOnly && accumulateEnterLeaveListenersForEvent(
                    dispatchQueue,
                    accumulateTargetOnly,
                    reactEventType,
                    inCapturePhase,
                    true
                  );
                }
              }
            }
            a: {
              reactName = targetInst ? getNodeFromInstance(targetInst) : window;
              SyntheticEventCtor = reactName.nodeName && reactName.nodeName.toLowerCase();
              if ("select" === SyntheticEventCtor || "input" === SyntheticEventCtor && "file" === reactName.type)
                var getTargetInstFunc = getTargetInstForChangeEvent;
              else if (isTextInputElement(reactName))
                if (isInputEventSupported)
                  getTargetInstFunc = getTargetInstForInputOrChangeEvent;
                else {
                  getTargetInstFunc = getTargetInstForInputEventPolyfill;
                  var handleEventFunc = handleEventsForInputEventPolyfill;
                }
              else
                SyntheticEventCtor = reactName.nodeName, !SyntheticEventCtor || "input" !== SyntheticEventCtor.toLowerCase() || "checkbox" !== reactName.type && "radio" !== reactName.type ? targetInst && isCustomElement(targetInst.elementType) && (getTargetInstFunc = getTargetInstForChangeEvent) : getTargetInstFunc = getTargetInstForClickEvent;
              if (getTargetInstFunc && (getTargetInstFunc = getTargetInstFunc(domEventName, targetInst))) {
                createAndAccumulateChangeEvent(
                  dispatchQueue,
                  getTargetInstFunc,
                  nativeEvent,
                  nativeEventTarget
                );
                break a;
              }
              handleEventFunc && handleEventFunc(domEventName, reactName, targetInst);
              "focusout" === domEventName && targetInst && "number" === reactName.type && null != targetInst.memoizedProps.value && setDefaultValue(reactName, "number", reactName.value);
            }
            handleEventFunc = targetInst ? getNodeFromInstance(targetInst) : window;
            switch (domEventName) {
              case "focusin":
                if (isTextInputElement(handleEventFunc) || "true" === handleEventFunc.contentEditable)
                  activeElement = handleEventFunc, activeElementInst = targetInst, lastSelection = null;
                break;
              case "focusout":
                lastSelection = activeElementInst = activeElement = null;
                break;
              case "mousedown":
                mouseDown = true;
                break;
              case "contextmenu":
              case "mouseup":
              case "dragend":
                mouseDown = false;
                constructSelectEvent(dispatchQueue, nativeEvent, nativeEventTarget);
                break;
              case "selectionchange":
                if (skipSelectionChangeEvent) break;
              case "keydown":
              case "keyup":
                constructSelectEvent(dispatchQueue, nativeEvent, nativeEventTarget);
            }
            var fallbackData;
            if (canUseCompositionEvent)
              b: {
                switch (domEventName) {
                  case "compositionstart":
                    var eventType = "onCompositionStart";
                    break b;
                  case "compositionend":
                    eventType = "onCompositionEnd";
                    break b;
                  case "compositionupdate":
                    eventType = "onCompositionUpdate";
                    break b;
                }
                eventType = void 0;
              }
            else
              isComposing ? isFallbackCompositionEnd(domEventName, nativeEvent) && (eventType = "onCompositionEnd") : "keydown" === domEventName && 229 === nativeEvent.keyCode && (eventType = "onCompositionStart");
            eventType && (useFallbackCompositionData && "ko" !== nativeEvent.locale && (isComposing || "onCompositionStart" !== eventType ? "onCompositionEnd" === eventType && isComposing && (fallbackData = getData()) : (root = nativeEventTarget, startText = "value" in root ? root.value : root.textContent, isComposing = true)), handleEventFunc = accumulateTwoPhaseListeners(targetInst, eventType), 0 < handleEventFunc.length && (eventType = new SyntheticCompositionEvent(
              eventType,
              domEventName,
              null,
              nativeEvent,
              nativeEventTarget
            ), dispatchQueue.push({ event: eventType, listeners: handleEventFunc }), fallbackData ? eventType.data = fallbackData : (fallbackData = getDataFromCustomEvent(nativeEvent), null !== fallbackData && (eventType.data = fallbackData))));
            if (fallbackData = canUseTextInputEvent ? getNativeBeforeInputChars(domEventName, nativeEvent) : getFallbackBeforeInputChars(domEventName, nativeEvent))
              eventType = accumulateTwoPhaseListeners(targetInst, "onBeforeInput"), 0 < eventType.length && (handleEventFunc = new SyntheticCompositionEvent(
                "onBeforeInput",
                "beforeinput",
                null,
                nativeEvent,
                nativeEventTarget
              ), dispatchQueue.push({
                event: handleEventFunc,
                listeners: eventType
              }), handleEventFunc.data = fallbackData);
            extractEvents$1(
              dispatchQueue,
              domEventName,
              targetInst,
              nativeEvent,
              nativeEventTarget
            );
          }
          processDispatchQueue(dispatchQueue, eventSystemFlags);
        });
      }
      function createDispatchListener(instance, listener, currentTarget) {
        return {
          instance,
          listener,
          currentTarget
        };
      }
      function accumulateTwoPhaseListeners(targetFiber, reactName) {
        for (var captureName = reactName + "Capture", listeners = []; null !== targetFiber; ) {
          var _instance2 = targetFiber, stateNode = _instance2.stateNode;
          _instance2 = _instance2.tag;
          5 !== _instance2 && 26 !== _instance2 && 27 !== _instance2 || null === stateNode || (_instance2 = getListener(targetFiber, captureName), null != _instance2 && listeners.unshift(
            createDispatchListener(targetFiber, _instance2, stateNode)
          ), _instance2 = getListener(targetFiber, reactName), null != _instance2 && listeners.push(
            createDispatchListener(targetFiber, _instance2, stateNode)
          ));
          if (3 === targetFiber.tag) return listeners;
          targetFiber = targetFiber.return;
        }
        return [];
      }
      function getParent(inst) {
        if (null === inst) return null;
        do
          inst = inst.return;
        while (inst && 5 !== inst.tag && 27 !== inst.tag);
        return inst ? inst : null;
      }
      function accumulateEnterLeaveListenersForEvent(dispatchQueue, event, target, common, inCapturePhase) {
        for (var registrationName = event._reactName, listeners = []; null !== target && target !== common; ) {
          var _instance3 = target, alternate = _instance3.alternate, stateNode = _instance3.stateNode;
          _instance3 = _instance3.tag;
          if (null !== alternate && alternate === common) break;
          5 !== _instance3 && 26 !== _instance3 && 27 !== _instance3 || null === stateNode || (alternate = stateNode, inCapturePhase ? (stateNode = getListener(target, registrationName), null != stateNode && listeners.unshift(
            createDispatchListener(target, stateNode, alternate)
          )) : inCapturePhase || (stateNode = getListener(target, registrationName), null != stateNode && listeners.push(
            createDispatchListener(target, stateNode, alternate)
          )));
          target = target.return;
        }
        0 !== listeners.length && dispatchQueue.push({ event, listeners });
      }
      var NORMALIZE_NEWLINES_REGEX = /\r\n?/g;
      var NORMALIZE_NULL_AND_REPLACEMENT_REGEX = /\u0000|\uFFFD/g;
      function normalizeMarkupForTextOrAttribute(markup) {
        return ("string" === typeof markup ? markup : "" + markup).replace(NORMALIZE_NEWLINES_REGEX, "\n").replace(NORMALIZE_NULL_AND_REPLACEMENT_REGEX, "");
      }
      function checkForUnmatchedText(serverText, clientText) {
        clientText = normalizeMarkupForTextOrAttribute(clientText);
        return normalizeMarkupForTextOrAttribute(serverText) === clientText ? true : false;
      }
      function setProp(domElement, tag, key, value, props, prevValue) {
        switch (key) {
          case "children":
            "string" === typeof value ? "body" === tag || "textarea" === tag && "" === value || setTextContent(domElement, value) : ("number" === typeof value || "bigint" === typeof value) && "body" !== tag && setTextContent(domElement, "" + value);
            break;
          case "className":
            setValueForKnownAttribute(domElement, "class", value);
            break;
          case "tabIndex":
            setValueForKnownAttribute(domElement, "tabindex", value);
            break;
          case "dir":
          case "role":
          case "viewBox":
          case "width":
          case "height":
            setValueForKnownAttribute(domElement, key, value);
            break;
          case "style":
            setValueForStyles(domElement, value, prevValue);
            break;
          case "data":
            if ("object" !== tag) {
              setValueForKnownAttribute(domElement, "data", value);
              break;
            }
          case "src":
          case "href":
            if ("" === value && ("a" !== tag || "href" !== key)) {
              domElement.removeAttribute(key);
              break;
            }
            if (null == value || "function" === typeof value || "symbol" === typeof value || "boolean" === typeof value) {
              domElement.removeAttribute(key);
              break;
            }
            value = sanitizeURL("" + value);
            domElement.setAttribute(key, value);
            break;
          case "action":
          case "formAction":
            if ("function" === typeof value) {
              domElement.setAttribute(
                key,
                "javascript:throw new Error('A React form was unexpectedly submitted. If you called form.submit() manually, consider using form.requestSubmit() instead. If you\\'re trying to use event.stopPropagation() in a submit event handler, consider also calling event.preventDefault().')"
              );
              break;
            } else
              "function" === typeof prevValue && ("formAction" === key ? ("input" !== tag && setProp(domElement, tag, "name", props.name, props, null), setProp(
                domElement,
                tag,
                "formEncType",
                props.formEncType,
                props,
                null
              ), setProp(
                domElement,
                tag,
                "formMethod",
                props.formMethod,
                props,
                null
              ), setProp(
                domElement,
                tag,
                "formTarget",
                props.formTarget,
                props,
                null
              )) : (setProp(domElement, tag, "encType", props.encType, props, null), setProp(domElement, tag, "method", props.method, props, null), setProp(domElement, tag, "target", props.target, props, null)));
            if (null == value || "symbol" === typeof value || "boolean" === typeof value) {
              domElement.removeAttribute(key);
              break;
            }
            value = sanitizeURL("" + value);
            domElement.setAttribute(key, value);
            break;
          case "onClick":
            null != value && (domElement.onclick = noop$1);
            break;
          case "onScroll":
            null != value && listenToNonDelegatedEvent("scroll", domElement);
            break;
          case "onScrollEnd":
            null != value && listenToNonDelegatedEvent("scrollend", domElement);
            break;
          case "dangerouslySetInnerHTML":
            if (null != value) {
              if ("object" !== typeof value || !("__html" in value))
                throw Error(formatProdErrorMessage(61));
              key = value.__html;
              if (null != key) {
                if (null != props.children) throw Error(formatProdErrorMessage(60));
                domElement.innerHTML = key;
              }
            }
            break;
          case "multiple":
            domElement.multiple = value && "function" !== typeof value && "symbol" !== typeof value;
            break;
          case "muted":
            domElement.muted = value && "function" !== typeof value && "symbol" !== typeof value;
            break;
          case "suppressContentEditableWarning":
          case "suppressHydrationWarning":
          case "defaultValue":
          case "defaultChecked":
          case "innerHTML":
          case "ref":
            break;
          case "autoFocus":
            break;
          case "xlinkHref":
            if (null == value || "function" === typeof value || "boolean" === typeof value || "symbol" === typeof value) {
              domElement.removeAttribute("xlink:href");
              break;
            }
            key = sanitizeURL("" + value);
            domElement.setAttributeNS(
              "http://www.w3.org/1999/xlink",
              "xlink:href",
              key
            );
            break;
          case "contentEditable":
          case "spellCheck":
          case "draggable":
          case "value":
          case "autoReverse":
          case "externalResourcesRequired":
          case "focusable":
          case "preserveAlpha":
            null != value && "function" !== typeof value && "symbol" !== typeof value ? domElement.setAttribute(key, "" + value) : domElement.removeAttribute(key);
            break;
          case "inert":
          case "allowFullScreen":
          case "async":
          case "autoPlay":
          case "controls":
          case "default":
          case "defer":
          case "disabled":
          case "disablePictureInPicture":
          case "disableRemotePlayback":
          case "formNoValidate":
          case "hidden":
          case "loop":
          case "noModule":
          case "noValidate":
          case "open":
          case "playsInline":
          case "readOnly":
          case "required":
          case "reversed":
          case "scoped":
          case "seamless":
          case "itemScope":
            value && "function" !== typeof value && "symbol" !== typeof value ? domElement.setAttribute(key, "") : domElement.removeAttribute(key);
            break;
          case "capture":
          case "download":
            true === value ? domElement.setAttribute(key, "") : false !== value && null != value && "function" !== typeof value && "symbol" !== typeof value ? domElement.setAttribute(key, value) : domElement.removeAttribute(key);
            break;
          case "cols":
          case "rows":
          case "size":
          case "span":
            null != value && "function" !== typeof value && "symbol" !== typeof value && !isNaN(value) && 1 <= value ? domElement.setAttribute(key, value) : domElement.removeAttribute(key);
            break;
          case "rowSpan":
          case "start":
            null == value || "function" === typeof value || "symbol" === typeof value || isNaN(value) ? domElement.removeAttribute(key) : domElement.setAttribute(key, value);
            break;
          case "popover":
            listenToNonDelegatedEvent("beforetoggle", domElement);
            listenToNonDelegatedEvent("toggle", domElement);
            setValueForAttribute(domElement, "popover", value);
            break;
          case "xlinkActuate":
            setValueForNamespacedAttribute(
              domElement,
              "http://www.w3.org/1999/xlink",
              "xlink:actuate",
              value
            );
            break;
          case "xlinkArcrole":
            setValueForNamespacedAttribute(
              domElement,
              "http://www.w3.org/1999/xlink",
              "xlink:arcrole",
              value
            );
            break;
          case "xlinkRole":
            setValueForNamespacedAttribute(
              domElement,
              "http://www.w3.org/1999/xlink",
              "xlink:role",
              value
            );
            break;
          case "xlinkShow":
            setValueForNamespacedAttribute(
              domElement,
              "http://www.w3.org/1999/xlink",
              "xlink:show",
              value
            );
            break;
          case "xlinkTitle":
            setValueForNamespacedAttribute(
              domElement,
              "http://www.w3.org/1999/xlink",
              "xlink:title",
              value
            );
            break;
          case "xlinkType":
            setValueForNamespacedAttribute(
              domElement,
              "http://www.w3.org/1999/xlink",
              "xlink:type",
              value
            );
            break;
          case "xmlBase":
            setValueForNamespacedAttribute(
              domElement,
              "http://www.w3.org/XML/1998/namespace",
              "xml:base",
              value
            );
            break;
          case "xmlLang":
            setValueForNamespacedAttribute(
              domElement,
              "http://www.w3.org/XML/1998/namespace",
              "xml:lang",
              value
            );
            break;
          case "xmlSpace":
            setValueForNamespacedAttribute(
              domElement,
              "http://www.w3.org/XML/1998/namespace",
              "xml:space",
              value
            );
            break;
          case "is":
            setValueForAttribute(domElement, "is", value);
            break;
          case "innerText":
          case "textContent":
            break;
          default:
            if (!(2 < key.length) || "o" !== key[0] && "O" !== key[0] || "n" !== key[1] && "N" !== key[1])
              key = aliases.get(key) || key, setValueForAttribute(domElement, key, value);
        }
      }
      function setPropOnCustomElement(domElement, tag, key, value, props, prevValue) {
        switch (key) {
          case "style":
            setValueForStyles(domElement, value, prevValue);
            break;
          case "dangerouslySetInnerHTML":
            if (null != value) {
              if ("object" !== typeof value || !("__html" in value))
                throw Error(formatProdErrorMessage(61));
              key = value.__html;
              if (null != key) {
                if (null != props.children) throw Error(formatProdErrorMessage(60));
                domElement.innerHTML = key;
              }
            }
            break;
          case "children":
            "string" === typeof value ? setTextContent(domElement, value) : ("number" === typeof value || "bigint" === typeof value) && setTextContent(domElement, "" + value);
            break;
          case "onScroll":
            null != value && listenToNonDelegatedEvent("scroll", domElement);
            break;
          case "onScrollEnd":
            null != value && listenToNonDelegatedEvent("scrollend", domElement);
            break;
          case "onClick":
            null != value && (domElement.onclick = noop$1);
            break;
          case "suppressContentEditableWarning":
          case "suppressHydrationWarning":
          case "innerHTML":
          case "ref":
            break;
          case "innerText":
          case "textContent":
            break;
          default:
            if (!registrationNameDependencies.hasOwnProperty(key))
              a: {
                if ("o" === key[0] && "n" === key[1] && (props = key.endsWith("Capture"), tag = key.slice(2, props ? key.length - 7 : void 0), prevValue = domElement[internalPropsKey] || null, prevValue = null != prevValue ? prevValue[key] : null, "function" === typeof prevValue && domElement.removeEventListener(tag, prevValue, props), "function" === typeof value)) {
                  "function" !== typeof prevValue && null !== prevValue && (key in domElement ? domElement[key] = null : domElement.hasAttribute(key) && domElement.removeAttribute(key));
                  domElement.addEventListener(tag, value, props);
                  break a;
                }
                key in domElement ? domElement[key] = value : true === value ? domElement.setAttribute(key, "") : setValueForAttribute(domElement, key, value);
              }
        }
      }
      function setInitialProperties(domElement, tag, props) {
        switch (tag) {
          case "div":
          case "span":
          case "svg":
          case "path":
          case "a":
          case "g":
          case "p":
          case "li":
            break;
          case "img":
            listenToNonDelegatedEvent("error", domElement);
            listenToNonDelegatedEvent("load", domElement);
            var hasSrc = false, hasSrcSet = false, propKey;
            for (propKey in props)
              if (props.hasOwnProperty(propKey)) {
                var propValue = props[propKey];
                if (null != propValue)
                  switch (propKey) {
                    case "src":
                      hasSrc = true;
                      break;
                    case "srcSet":
                      hasSrcSet = true;
                      break;
                    case "children":
                    case "dangerouslySetInnerHTML":
                      throw Error(formatProdErrorMessage(137, tag));
                    default:
                      setProp(domElement, tag, propKey, propValue, props, null);
                  }
              }
            hasSrcSet && setProp(domElement, tag, "srcSet", props.srcSet, props, null);
            hasSrc && setProp(domElement, tag, "src", props.src, props, null);
            return;
          case "input":
            listenToNonDelegatedEvent("invalid", domElement);
            var defaultValue = propKey = propValue = hasSrcSet = null, checked = null, defaultChecked = null;
            for (hasSrc in props)
              if (props.hasOwnProperty(hasSrc)) {
                var propValue$184 = props[hasSrc];
                if (null != propValue$184)
                  switch (hasSrc) {
                    case "name":
                      hasSrcSet = propValue$184;
                      break;
                    case "type":
                      propValue = propValue$184;
                      break;
                    case "checked":
                      checked = propValue$184;
                      break;
                    case "defaultChecked":
                      defaultChecked = propValue$184;
                      break;
                    case "value":
                      propKey = propValue$184;
                      break;
                    case "defaultValue":
                      defaultValue = propValue$184;
                      break;
                    case "children":
                    case "dangerouslySetInnerHTML":
                      if (null != propValue$184)
                        throw Error(formatProdErrorMessage(137, tag));
                      break;
                    default:
                      setProp(domElement, tag, hasSrc, propValue$184, props, null);
                  }
              }
            initInput(
              domElement,
              propKey,
              defaultValue,
              checked,
              defaultChecked,
              propValue,
              hasSrcSet,
              false
            );
            return;
          case "select":
            listenToNonDelegatedEvent("invalid", domElement);
            hasSrc = propValue = propKey = null;
            for (hasSrcSet in props)
              if (props.hasOwnProperty(hasSrcSet) && (defaultValue = props[hasSrcSet], null != defaultValue))
                switch (hasSrcSet) {
                  case "value":
                    propKey = defaultValue;
                    break;
                  case "defaultValue":
                    propValue = defaultValue;
                    break;
                  case "multiple":
                    hasSrc = defaultValue;
                  default:
                    setProp(domElement, tag, hasSrcSet, defaultValue, props, null);
                }
            tag = propKey;
            props = propValue;
            domElement.multiple = !!hasSrc;
            null != tag ? updateOptions(domElement, !!hasSrc, tag, false) : null != props && updateOptions(domElement, !!hasSrc, props, true);
            return;
          case "textarea":
            listenToNonDelegatedEvent("invalid", domElement);
            propKey = hasSrcSet = hasSrc = null;
            for (propValue in props)
              if (props.hasOwnProperty(propValue) && (defaultValue = props[propValue], null != defaultValue))
                switch (propValue) {
                  case "value":
                    hasSrc = defaultValue;
                    break;
                  case "defaultValue":
                    hasSrcSet = defaultValue;
                    break;
                  case "children":
                    propKey = defaultValue;
                    break;
                  case "dangerouslySetInnerHTML":
                    if (null != defaultValue) throw Error(formatProdErrorMessage(91));
                    break;
                  default:
                    setProp(domElement, tag, propValue, defaultValue, props, null);
                }
            initTextarea(domElement, hasSrc, hasSrcSet, propKey);
            return;
          case "option":
            for (checked in props)
              if (props.hasOwnProperty(checked) && (hasSrc = props[checked], null != hasSrc))
                switch (checked) {
                  case "selected":
                    domElement.selected = hasSrc && "function" !== typeof hasSrc && "symbol" !== typeof hasSrc;
                    break;
                  default:
                    setProp(domElement, tag, checked, hasSrc, props, null);
                }
            return;
          case "dialog":
            listenToNonDelegatedEvent("beforetoggle", domElement);
            listenToNonDelegatedEvent("toggle", domElement);
            listenToNonDelegatedEvent("cancel", domElement);
            listenToNonDelegatedEvent("close", domElement);
            break;
          case "iframe":
          case "object":
            listenToNonDelegatedEvent("load", domElement);
            break;
          case "video":
          case "audio":
            for (hasSrc = 0; hasSrc < mediaEventTypes.length; hasSrc++)
              listenToNonDelegatedEvent(mediaEventTypes[hasSrc], domElement);
            break;
          case "image":
            listenToNonDelegatedEvent("error", domElement);
            listenToNonDelegatedEvent("load", domElement);
            break;
          case "details":
            listenToNonDelegatedEvent("toggle", domElement);
            break;
          case "embed":
          case "source":
          case "link":
            listenToNonDelegatedEvent("error", domElement), listenToNonDelegatedEvent("load", domElement);
          case "area":
          case "base":
          case "br":
          case "col":
          case "hr":
          case "keygen":
          case "meta":
          case "param":
          case "track":
          case "wbr":
          case "menuitem":
            for (defaultChecked in props)
              if (props.hasOwnProperty(defaultChecked) && (hasSrc = props[defaultChecked], null != hasSrc))
                switch (defaultChecked) {
                  case "children":
                  case "dangerouslySetInnerHTML":
                    throw Error(formatProdErrorMessage(137, tag));
                  default:
                    setProp(domElement, tag, defaultChecked, hasSrc, props, null);
                }
            return;
          default:
            if (isCustomElement(tag)) {
              for (propValue$184 in props)
                props.hasOwnProperty(propValue$184) && (hasSrc = props[propValue$184], void 0 !== hasSrc && setPropOnCustomElement(
                  domElement,
                  tag,
                  propValue$184,
                  hasSrc,
                  props,
                  void 0
                ));
              return;
            }
        }
        for (defaultValue in props)
          props.hasOwnProperty(defaultValue) && (hasSrc = props[defaultValue], null != hasSrc && setProp(domElement, tag, defaultValue, hasSrc, props, null));
      }
      function updateProperties(domElement, tag, lastProps, nextProps) {
        switch (tag) {
          case "div":
          case "span":
          case "svg":
          case "path":
          case "a":
          case "g":
          case "p":
          case "li":
            break;
          case "input":
            var name = null, type = null, value = null, defaultValue = null, lastDefaultValue = null, checked = null, defaultChecked = null;
            for (propKey in lastProps) {
              var lastProp = lastProps[propKey];
              if (lastProps.hasOwnProperty(propKey) && null != lastProp)
                switch (propKey) {
                  case "checked":
                    break;
                  case "value":
                    break;
                  case "defaultValue":
                    lastDefaultValue = lastProp;
                  default:
                    nextProps.hasOwnProperty(propKey) || setProp(domElement, tag, propKey, null, nextProps, lastProp);
                }
            }
            for (var propKey$201 in nextProps) {
              var propKey = nextProps[propKey$201];
              lastProp = lastProps[propKey$201];
              if (nextProps.hasOwnProperty(propKey$201) && (null != propKey || null != lastProp))
                switch (propKey$201) {
                  case "type":
                    type = propKey;
                    break;
                  case "name":
                    name = propKey;
                    break;
                  case "checked":
                    checked = propKey;
                    break;
                  case "defaultChecked":
                    defaultChecked = propKey;
                    break;
                  case "value":
                    value = propKey;
                    break;
                  case "defaultValue":
                    defaultValue = propKey;
                    break;
                  case "children":
                  case "dangerouslySetInnerHTML":
                    if (null != propKey)
                      throw Error(formatProdErrorMessage(137, tag));
                    break;
                  default:
                    propKey !== lastProp && setProp(
                      domElement,
                      tag,
                      propKey$201,
                      propKey,
                      nextProps,
                      lastProp
                    );
                }
            }
            updateInput(
              domElement,
              value,
              defaultValue,
              lastDefaultValue,
              checked,
              defaultChecked,
              type,
              name
            );
            return;
          case "select":
            propKey = value = defaultValue = propKey$201 = null;
            for (type in lastProps)
              if (lastDefaultValue = lastProps[type], lastProps.hasOwnProperty(type) && null != lastDefaultValue)
                switch (type) {
                  case "value":
                    break;
                  case "multiple":
                    propKey = lastDefaultValue;
                  default:
                    nextProps.hasOwnProperty(type) || setProp(
                      domElement,
                      tag,
                      type,
                      null,
                      nextProps,
                      lastDefaultValue
                    );
                }
            for (name in nextProps)
              if (type = nextProps[name], lastDefaultValue = lastProps[name], nextProps.hasOwnProperty(name) && (null != type || null != lastDefaultValue))
                switch (name) {
                  case "value":
                    propKey$201 = type;
                    break;
                  case "defaultValue":
                    defaultValue = type;
                    break;
                  case "multiple":
                    value = type;
                  default:
                    type !== lastDefaultValue && setProp(
                      domElement,
                      tag,
                      name,
                      type,
                      nextProps,
                      lastDefaultValue
                    );
                }
            tag = defaultValue;
            lastProps = value;
            nextProps = propKey;
            null != propKey$201 ? updateOptions(domElement, !!lastProps, propKey$201, false) : !!nextProps !== !!lastProps && (null != tag ? updateOptions(domElement, !!lastProps, tag, true) : updateOptions(domElement, !!lastProps, lastProps ? [] : "", false));
            return;
          case "textarea":
            propKey = propKey$201 = null;
            for (defaultValue in lastProps)
              if (name = lastProps[defaultValue], lastProps.hasOwnProperty(defaultValue) && null != name && !nextProps.hasOwnProperty(defaultValue))
                switch (defaultValue) {
                  case "value":
                    break;
                  case "children":
                    break;
                  default:
                    setProp(domElement, tag, defaultValue, null, nextProps, name);
                }
            for (value in nextProps)
              if (name = nextProps[value], type = lastProps[value], nextProps.hasOwnProperty(value) && (null != name || null != type))
                switch (value) {
                  case "value":
                    propKey$201 = name;
                    break;
                  case "defaultValue":
                    propKey = name;
                    break;
                  case "children":
                    break;
                  case "dangerouslySetInnerHTML":
                    if (null != name) throw Error(formatProdErrorMessage(91));
                    break;
                  default:
                    name !== type && setProp(domElement, tag, value, name, nextProps, type);
                }
            updateTextarea(domElement, propKey$201, propKey);
            return;
          case "option":
            for (var propKey$217 in lastProps)
              if (propKey$201 = lastProps[propKey$217], lastProps.hasOwnProperty(propKey$217) && null != propKey$201 && !nextProps.hasOwnProperty(propKey$217))
                switch (propKey$217) {
                  case "selected":
                    domElement.selected = false;
                    break;
                  default:
                    setProp(
                      domElement,
                      tag,
                      propKey$217,
                      null,
                      nextProps,
                      propKey$201
                    );
                }
            for (lastDefaultValue in nextProps)
              if (propKey$201 = nextProps[lastDefaultValue], propKey = lastProps[lastDefaultValue], nextProps.hasOwnProperty(lastDefaultValue) && propKey$201 !== propKey && (null != propKey$201 || null != propKey))
                switch (lastDefaultValue) {
                  case "selected":
                    domElement.selected = propKey$201 && "function" !== typeof propKey$201 && "symbol" !== typeof propKey$201;
                    break;
                  default:
                    setProp(
                      domElement,
                      tag,
                      lastDefaultValue,
                      propKey$201,
                      nextProps,
                      propKey
                    );
                }
            return;
          case "img":
          case "link":
          case "area":
          case "base":
          case "br":
          case "col":
          case "embed":
          case "hr":
          case "keygen":
          case "meta":
          case "param":
          case "source":
          case "track":
          case "wbr":
          case "menuitem":
            for (var propKey$222 in lastProps)
              propKey$201 = lastProps[propKey$222], lastProps.hasOwnProperty(propKey$222) && null != propKey$201 && !nextProps.hasOwnProperty(propKey$222) && setProp(domElement, tag, propKey$222, null, nextProps, propKey$201);
            for (checked in nextProps)
              if (propKey$201 = nextProps[checked], propKey = lastProps[checked], nextProps.hasOwnProperty(checked) && propKey$201 !== propKey && (null != propKey$201 || null != propKey))
                switch (checked) {
                  case "children":
                  case "dangerouslySetInnerHTML":
                    if (null != propKey$201)
                      throw Error(formatProdErrorMessage(137, tag));
                    break;
                  default:
                    setProp(
                      domElement,
                      tag,
                      checked,
                      propKey$201,
                      nextProps,
                      propKey
                    );
                }
            return;
          default:
            if (isCustomElement(tag)) {
              for (var propKey$227 in lastProps)
                propKey$201 = lastProps[propKey$227], lastProps.hasOwnProperty(propKey$227) && void 0 !== propKey$201 && !nextProps.hasOwnProperty(propKey$227) && setPropOnCustomElement(
                  domElement,
                  tag,
                  propKey$227,
                  void 0,
                  nextProps,
                  propKey$201
                );
              for (defaultChecked in nextProps)
                propKey$201 = nextProps[defaultChecked], propKey = lastProps[defaultChecked], !nextProps.hasOwnProperty(defaultChecked) || propKey$201 === propKey || void 0 === propKey$201 && void 0 === propKey || setPropOnCustomElement(
                  domElement,
                  tag,
                  defaultChecked,
                  propKey$201,
                  nextProps,
                  propKey
                );
              return;
            }
        }
        for (var propKey$232 in lastProps)
          propKey$201 = lastProps[propKey$232], lastProps.hasOwnProperty(propKey$232) && null != propKey$201 && !nextProps.hasOwnProperty(propKey$232) && setProp(domElement, tag, propKey$232, null, nextProps, propKey$201);
        for (lastProp in nextProps)
          propKey$201 = nextProps[lastProp], propKey = lastProps[lastProp], !nextProps.hasOwnProperty(lastProp) || propKey$201 === propKey || null == propKey$201 && null == propKey || setProp(domElement, tag, lastProp, propKey$201, nextProps, propKey);
      }
      function isLikelyStaticResource(initiatorType) {
        switch (initiatorType) {
          case "css":
          case "script":
          case "font":
          case "img":
          case "image":
          case "input":
          case "link":
            return true;
          default:
            return false;
        }
      }
      function estimateBandwidth() {
        if ("function" === typeof performance.getEntriesByType) {
          for (var count = 0, bits = 0, resourceEntries = performance.getEntriesByType("resource"), i = 0; i < resourceEntries.length; i++) {
            var entry = resourceEntries[i], transferSize = entry.transferSize, initiatorType = entry.initiatorType, duration = entry.duration;
            if (transferSize && duration && isLikelyStaticResource(initiatorType)) {
              initiatorType = 0;
              duration = entry.responseEnd;
              for (i += 1; i < resourceEntries.length; i++) {
                var overlapEntry = resourceEntries[i], overlapStartTime = overlapEntry.startTime;
                if (overlapStartTime > duration) break;
                var overlapTransferSize = overlapEntry.transferSize, overlapInitiatorType = overlapEntry.initiatorType;
                overlapTransferSize && isLikelyStaticResource(overlapInitiatorType) && (overlapEntry = overlapEntry.responseEnd, initiatorType += overlapTransferSize * (overlapEntry < duration ? 1 : (duration - overlapStartTime) / (overlapEntry - overlapStartTime)));
              }
              --i;
              bits += 8 * (transferSize + initiatorType) / (entry.duration / 1e3);
              count++;
              if (10 < count) break;
            }
          }
          if (0 < count) return bits / count / 1e6;
        }
        return navigator.connection && (count = navigator.connection.downlink, "number" === typeof count) ? count : 5;
      }
      var eventsEnabled = null;
      var selectionInformation = null;
      function getOwnerDocumentFromRootContainer(rootContainerElement) {
        return 9 === rootContainerElement.nodeType ? rootContainerElement : rootContainerElement.ownerDocument;
      }
      function getOwnHostContext(namespaceURI) {
        switch (namespaceURI) {
          case "http://www.w3.org/2000/svg":
            return 1;
          case "http://www.w3.org/1998/Math/MathML":
            return 2;
          default:
            return 0;
        }
      }
      function getChildHostContextProd(parentNamespace, type) {
        if (0 === parentNamespace)
          switch (type) {
            case "svg":
              return 1;
            case "math":
              return 2;
            default:
              return 0;
          }
        return 1 === parentNamespace && "foreignObject" === type ? 0 : parentNamespace;
      }
      function shouldSetTextContent(type, props) {
        return "textarea" === type || "noscript" === type || "string" === typeof props.children || "number" === typeof props.children || "bigint" === typeof props.children || "object" === typeof props.dangerouslySetInnerHTML && null !== props.dangerouslySetInnerHTML && null != props.dangerouslySetInnerHTML.__html;
      }
      var currentPopstateTransitionEvent = null;
      function shouldAttemptEagerTransition() {
        var event = window.event;
        if (event && "popstate" === event.type) {
          if (event === currentPopstateTransitionEvent) return false;
          currentPopstateTransitionEvent = event;
          return true;
        }
        currentPopstateTransitionEvent = null;
        return false;
      }
      var scheduleTimeout = "function" === typeof setTimeout ? setTimeout : void 0;
      var cancelTimeout = "function" === typeof clearTimeout ? clearTimeout : void 0;
      var localPromise = "function" === typeof Promise ? Promise : void 0;
      var scheduleMicrotask = "function" === typeof queueMicrotask ? queueMicrotask : "undefined" !== typeof localPromise ? function(callback) {
        return localPromise.resolve(null).then(callback).catch(handleErrorInNextTick);
      } : scheduleTimeout;
      function handleErrorInNextTick(error) {
        setTimeout(function() {
          throw error;
        });
      }
      function isSingletonScope(type) {
        return "head" === type;
      }
      function clearHydrationBoundary(parentInstance, hydrationInstance) {
        var node = hydrationInstance, depth = 0;
        do {
          var nextNode = node.nextSibling;
          parentInstance.removeChild(node);
          if (nextNode && 8 === nextNode.nodeType)
            if (node = nextNode.data, "/$" === node || "/&" === node) {
              if (0 === depth) {
                parentInstance.removeChild(nextNode);
                retryIfBlockedOn(hydrationInstance);
                return;
              }
              depth--;
            } else if ("$" === node || "$?" === node || "$~" === node || "$!" === node || "&" === node)
              depth++;
            else if ("html" === node)
              releaseSingletonInstance(parentInstance.ownerDocument.documentElement);
            else if ("head" === node) {
              node = parentInstance.ownerDocument.head;
              releaseSingletonInstance(node);
              for (var node$jscomp$0 = node.firstChild; node$jscomp$0; ) {
                var nextNode$jscomp$0 = node$jscomp$0.nextSibling, nodeName = node$jscomp$0.nodeName;
                node$jscomp$0[internalHoistableMarker] || "SCRIPT" === nodeName || "STYLE" === nodeName || "LINK" === nodeName && "stylesheet" === node$jscomp$0.rel.toLowerCase() || node.removeChild(node$jscomp$0);
                node$jscomp$0 = nextNode$jscomp$0;
              }
            } else
              "body" === node && releaseSingletonInstance(parentInstance.ownerDocument.body);
          node = nextNode;
        } while (node);
        retryIfBlockedOn(hydrationInstance);
      }
      function hideOrUnhideDehydratedBoundary(suspenseInstance, isHidden) {
        var node = suspenseInstance;
        suspenseInstance = 0;
        do {
          var nextNode = node.nextSibling;
          1 === node.nodeType ? isHidden ? (node._stashedDisplay = node.style.display, node.style.display = "none") : (node.style.display = node._stashedDisplay || "", "" === node.getAttribute("style") && node.removeAttribute("style")) : 3 === node.nodeType && (isHidden ? (node._stashedText = node.nodeValue, node.nodeValue = "") : node.nodeValue = node._stashedText || "");
          if (nextNode && 8 === nextNode.nodeType)
            if (node = nextNode.data, "/$" === node)
              if (0 === suspenseInstance) break;
              else suspenseInstance--;
            else
              "$" !== node && "$?" !== node && "$~" !== node && "$!" !== node || suspenseInstance++;
          node = nextNode;
        } while (node);
      }
      function clearContainerSparingly(container) {
        var nextNode = container.firstChild;
        nextNode && 10 === nextNode.nodeType && (nextNode = nextNode.nextSibling);
        for (; nextNode; ) {
          var node = nextNode;
          nextNode = nextNode.nextSibling;
          switch (node.nodeName) {
            case "HTML":
            case "HEAD":
            case "BODY":
              clearContainerSparingly(node);
              detachDeletedInstance(node);
              continue;
            case "SCRIPT":
            case "STYLE":
              continue;
            case "LINK":
              if ("stylesheet" === node.rel.toLowerCase()) continue;
          }
          container.removeChild(node);
        }
      }
      function canHydrateInstance(instance, type, props, inRootOrSingleton) {
        for (; 1 === instance.nodeType; ) {
          var anyProps = props;
          if (instance.nodeName.toLowerCase() !== type.toLowerCase()) {
            if (!inRootOrSingleton && ("INPUT" !== instance.nodeName || "hidden" !== instance.type))
              break;
          } else if (!inRootOrSingleton)
            if ("input" === type && "hidden" === instance.type) {
              var name = null == anyProps.name ? null : "" + anyProps.name;
              if ("hidden" === anyProps.type && instance.getAttribute("name") === name)
                return instance;
            } else return instance;
          else if (!instance[internalHoistableMarker])
            switch (type) {
              case "meta":
                if (!instance.hasAttribute("itemprop")) break;
                return instance;
              case "link":
                name = instance.getAttribute("rel");
                if ("stylesheet" === name && instance.hasAttribute("data-precedence"))
                  break;
                else if (name !== anyProps.rel || instance.getAttribute("href") !== (null == anyProps.href || "" === anyProps.href ? null : anyProps.href) || instance.getAttribute("crossorigin") !== (null == anyProps.crossOrigin ? null : anyProps.crossOrigin) || instance.getAttribute("title") !== (null == anyProps.title ? null : anyProps.title))
                  break;
                return instance;
              case "style":
                if (instance.hasAttribute("data-precedence")) break;
                return instance;
              case "script":
                name = instance.getAttribute("src");
                if ((name !== (null == anyProps.src ? null : anyProps.src) || instance.getAttribute("type") !== (null == anyProps.type ? null : anyProps.type) || instance.getAttribute("crossorigin") !== (null == anyProps.crossOrigin ? null : anyProps.crossOrigin)) && name && instance.hasAttribute("async") && !instance.hasAttribute("itemprop"))
                  break;
                return instance;
              default:
                return instance;
            }
          instance = getNextHydratable(instance.nextSibling);
          if (null === instance) break;
        }
        return null;
      }
      function canHydrateTextInstance(instance, text, inRootOrSingleton) {
        if ("" === text) return null;
        for (; 3 !== instance.nodeType; ) {
          if ((1 !== instance.nodeType || "INPUT" !== instance.nodeName || "hidden" !== instance.type) && !inRootOrSingleton)
            return null;
          instance = getNextHydratable(instance.nextSibling);
          if (null === instance) return null;
        }
        return instance;
      }
      function canHydrateHydrationBoundary(instance, inRootOrSingleton) {
        for (; 8 !== instance.nodeType; ) {
          if ((1 !== instance.nodeType || "INPUT" !== instance.nodeName || "hidden" !== instance.type) && !inRootOrSingleton)
            return null;
          instance = getNextHydratable(instance.nextSibling);
          if (null === instance) return null;
        }
        return instance;
      }
      function isSuspenseInstancePending(instance) {
        return "$?" === instance.data || "$~" === instance.data;
      }
      function isSuspenseInstanceFallback(instance) {
        return "$!" === instance.data || "$?" === instance.data && "loading" !== instance.ownerDocument.readyState;
      }
      function registerSuspenseInstanceRetry(instance, callback) {
        var ownerDocument = instance.ownerDocument;
        if ("$~" === instance.data) instance._reactRetry = callback;
        else if ("$?" !== instance.data || "loading" !== ownerDocument.readyState)
          callback();
        else {
          var listener = function() {
            callback();
            ownerDocument.removeEventListener("DOMContentLoaded", listener);
          };
          ownerDocument.addEventListener("DOMContentLoaded", listener);
          instance._reactRetry = listener;
        }
      }
      function getNextHydratable(node) {
        for (; null != node; node = node.nextSibling) {
          var nodeType = node.nodeType;
          if (1 === nodeType || 3 === nodeType) break;
          if (8 === nodeType) {
            nodeType = node.data;
            if ("$" === nodeType || "$!" === nodeType || "$?" === nodeType || "$~" === nodeType || "&" === nodeType || "F!" === nodeType || "F" === nodeType)
              break;
            if ("/$" === nodeType || "/&" === nodeType) return null;
          }
        }
        return node;
      }
      var previousHydratableOnEnteringScopedSingleton = null;
      function getNextHydratableInstanceAfterHydrationBoundary(hydrationInstance) {
        hydrationInstance = hydrationInstance.nextSibling;
        for (var depth = 0; hydrationInstance; ) {
          if (8 === hydrationInstance.nodeType) {
            var data = hydrationInstance.data;
            if ("/$" === data || "/&" === data) {
              if (0 === depth)
                return getNextHydratable(hydrationInstance.nextSibling);
              depth--;
            } else
              "$" !== data && "$!" !== data && "$?" !== data && "$~" !== data && "&" !== data || depth++;
          }
          hydrationInstance = hydrationInstance.nextSibling;
        }
        return null;
      }
      function getParentHydrationBoundary(targetInstance) {
        targetInstance = targetInstance.previousSibling;
        for (var depth = 0; targetInstance; ) {
          if (8 === targetInstance.nodeType) {
            var data = targetInstance.data;
            if ("$" === data || "$!" === data || "$?" === data || "$~" === data || "&" === data) {
              if (0 === depth) return targetInstance;
              depth--;
            } else "/$" !== data && "/&" !== data || depth++;
          }
          targetInstance = targetInstance.previousSibling;
        }
        return null;
      }
      function resolveSingletonInstance(type, props, rootContainerInstance) {
        props = getOwnerDocumentFromRootContainer(rootContainerInstance);
        switch (type) {
          case "html":
            type = props.documentElement;
            if (!type) throw Error(formatProdErrorMessage(452));
            return type;
          case "head":
            type = props.head;
            if (!type) throw Error(formatProdErrorMessage(453));
            return type;
          case "body":
            type = props.body;
            if (!type) throw Error(formatProdErrorMessage(454));
            return type;
          default:
            throw Error(formatProdErrorMessage(451));
        }
      }
      function releaseSingletonInstance(instance) {
        for (var attributes = instance.attributes; attributes.length; )
          instance.removeAttributeNode(attributes[0]);
        detachDeletedInstance(instance);
      }
      var preloadPropsMap = /* @__PURE__ */ new Map();
      var preconnectsSet = /* @__PURE__ */ new Set();
      function getHoistableRoot(container) {
        return "function" === typeof container.getRootNode ? container.getRootNode() : 9 === container.nodeType ? container : container.ownerDocument;
      }
      var previousDispatcher = ReactDOMSharedInternals.d;
      ReactDOMSharedInternals.d = {
        f: flushSyncWork,
        r: requestFormReset,
        D: prefetchDNS,
        C: preconnect,
        L: preload,
        m: preloadModule,
        X: preinitScript,
        S: preinitStyle,
        M: preinitModuleScript
      };
      function flushSyncWork() {
        var previousWasRendering = previousDispatcher.f(), wasRendering = flushSyncWork$1();
        return previousWasRendering || wasRendering;
      }
      function requestFormReset(form) {
        var formInst = getInstanceFromNode(form);
        null !== formInst && 5 === formInst.tag && "form" === formInst.type ? requestFormReset$1(formInst) : previousDispatcher.r(form);
      }
      var globalDocument = "undefined" === typeof document ? null : document;
      function preconnectAs(rel, href, crossOrigin) {
        var ownerDocument = globalDocument;
        if (ownerDocument && "string" === typeof href && href) {
          var limitedEscapedHref = escapeSelectorAttributeValueInsideDoubleQuotes(href);
          limitedEscapedHref = 'link[rel="' + rel + '"][href="' + limitedEscapedHref + '"]';
          "string" === typeof crossOrigin && (limitedEscapedHref += '[crossorigin="' + crossOrigin + '"]');
          preconnectsSet.has(limitedEscapedHref) || (preconnectsSet.add(limitedEscapedHref), rel = { rel, crossOrigin, href }, null === ownerDocument.querySelector(limitedEscapedHref) && (href = ownerDocument.createElement("link"), setInitialProperties(href, "link", rel), markNodeAsHoistable(href), ownerDocument.head.appendChild(href)));
        }
      }
      function prefetchDNS(href) {
        previousDispatcher.D(href);
        preconnectAs("dns-prefetch", href, null);
      }
      function preconnect(href, crossOrigin) {
        previousDispatcher.C(href, crossOrigin);
        preconnectAs("preconnect", href, crossOrigin);
      }
      function preload(href, as, options2) {
        previousDispatcher.L(href, as, options2);
        var ownerDocument = globalDocument;
        if (ownerDocument && href && as) {
          var preloadSelector = 'link[rel="preload"][as="' + escapeSelectorAttributeValueInsideDoubleQuotes(as) + '"]';
          "image" === as ? options2 && options2.imageSrcSet ? (preloadSelector += '[imagesrcset="' + escapeSelectorAttributeValueInsideDoubleQuotes(
            options2.imageSrcSet
          ) + '"]', "string" === typeof options2.imageSizes && (preloadSelector += '[imagesizes="' + escapeSelectorAttributeValueInsideDoubleQuotes(
            options2.imageSizes
          ) + '"]')) : preloadSelector += '[href="' + escapeSelectorAttributeValueInsideDoubleQuotes(href) + '"]' : preloadSelector += '[href="' + escapeSelectorAttributeValueInsideDoubleQuotes(href) + '"]';
          var key = preloadSelector;
          switch (as) {
            case "style":
              key = getStyleKey(href);
              break;
            case "script":
              key = getScriptKey(href);
          }
          preloadPropsMap.has(key) || (href = assign(
            {
              rel: "preload",
              href: "image" === as && options2 && options2.imageSrcSet ? void 0 : href,
              as
            },
            options2
          ), preloadPropsMap.set(key, href), null !== ownerDocument.querySelector(preloadSelector) || "style" === as && ownerDocument.querySelector(getStylesheetSelectorFromKey(key)) || "script" === as && ownerDocument.querySelector(getScriptSelectorFromKey(key)) || (as = ownerDocument.createElement("link"), setInitialProperties(as, "link", href), markNodeAsHoistable(as), ownerDocument.head.appendChild(as)));
        }
      }
      function preloadModule(href, options2) {
        previousDispatcher.m(href, options2);
        var ownerDocument = globalDocument;
        if (ownerDocument && href) {
          var as = options2 && "string" === typeof options2.as ? options2.as : "script", preloadSelector = 'link[rel="modulepreload"][as="' + escapeSelectorAttributeValueInsideDoubleQuotes(as) + '"][href="' + escapeSelectorAttributeValueInsideDoubleQuotes(href) + '"]', key = preloadSelector;
          switch (as) {
            case "audioworklet":
            case "paintworklet":
            case "serviceworker":
            case "sharedworker":
            case "worker":
            case "script":
              key = getScriptKey(href);
          }
          if (!preloadPropsMap.has(key) && (href = assign({ rel: "modulepreload", href }, options2), preloadPropsMap.set(key, href), null === ownerDocument.querySelector(preloadSelector))) {
            switch (as) {
              case "audioworklet":
              case "paintworklet":
              case "serviceworker":
              case "sharedworker":
              case "worker":
              case "script":
                if (ownerDocument.querySelector(getScriptSelectorFromKey(key)))
                  return;
            }
            as = ownerDocument.createElement("link");
            setInitialProperties(as, "link", href);
            markNodeAsHoistable(as);
            ownerDocument.head.appendChild(as);
          }
        }
      }
      function preinitStyle(href, precedence, options2) {
        previousDispatcher.S(href, precedence, options2);
        var ownerDocument = globalDocument;
        if (ownerDocument && href) {
          var styles2 = getResourcesFromRoot(ownerDocument).hoistableStyles, key = getStyleKey(href);
          precedence = precedence || "default";
          var resource = styles2.get(key);
          if (!resource) {
            var state = { loading: 0, preload: null };
            if (resource = ownerDocument.querySelector(
              getStylesheetSelectorFromKey(key)
            ))
              state.loading = 5;
            else {
              href = assign(
                { rel: "stylesheet", href, "data-precedence": precedence },
                options2
              );
              (options2 = preloadPropsMap.get(key)) && adoptPreloadPropsForStylesheet(href, options2);
              var link = resource = ownerDocument.createElement("link");
              markNodeAsHoistable(link);
              setInitialProperties(link, "link", href);
              link._p = new Promise(function(resolve, reject) {
                link.onload = resolve;
                link.onerror = reject;
              });
              link.addEventListener("load", function() {
                state.loading |= 1;
              });
              link.addEventListener("error", function() {
                state.loading |= 2;
              });
              state.loading |= 4;
              insertStylesheet(resource, precedence, ownerDocument);
            }
            resource = {
              type: "stylesheet",
              instance: resource,
              count: 1,
              state
            };
            styles2.set(key, resource);
          }
        }
      }
      function preinitScript(src, options2) {
        previousDispatcher.X(src, options2);
        var ownerDocument = globalDocument;
        if (ownerDocument && src) {
          var scripts = getResourcesFromRoot(ownerDocument).hoistableScripts, key = getScriptKey(src), resource = scripts.get(key);
          resource || (resource = ownerDocument.querySelector(getScriptSelectorFromKey(key)), resource || (src = assign({ src, async: true }, options2), (options2 = preloadPropsMap.get(key)) && adoptPreloadPropsForScript(src, options2), resource = ownerDocument.createElement("script"), markNodeAsHoistable(resource), setInitialProperties(resource, "link", src), ownerDocument.head.appendChild(resource)), resource = {
            type: "script",
            instance: resource,
            count: 1,
            state: null
          }, scripts.set(key, resource));
        }
      }
      function preinitModuleScript(src, options2) {
        previousDispatcher.M(src, options2);
        var ownerDocument = globalDocument;
        if (ownerDocument && src) {
          var scripts = getResourcesFromRoot(ownerDocument).hoistableScripts, key = getScriptKey(src), resource = scripts.get(key);
          resource || (resource = ownerDocument.querySelector(getScriptSelectorFromKey(key)), resource || (src = assign({ src, async: true, type: "module" }, options2), (options2 = preloadPropsMap.get(key)) && adoptPreloadPropsForScript(src, options2), resource = ownerDocument.createElement("script"), markNodeAsHoistable(resource), setInitialProperties(resource, "link", src), ownerDocument.head.appendChild(resource)), resource = {
            type: "script",
            instance: resource,
            count: 1,
            state: null
          }, scripts.set(key, resource));
        }
      }
      function getResource(type, currentProps, pendingProps, currentResource) {
        var JSCompiler_inline_result = (JSCompiler_inline_result = rootInstanceStackCursor.current) ? getHoistableRoot(JSCompiler_inline_result) : null;
        if (!JSCompiler_inline_result) throw Error(formatProdErrorMessage(446));
        switch (type) {
          case "meta":
          case "title":
            return null;
          case "style":
            return "string" === typeof pendingProps.precedence && "string" === typeof pendingProps.href ? (currentProps = getStyleKey(pendingProps.href), pendingProps = getResourcesFromRoot(
              JSCompiler_inline_result
            ).hoistableStyles, currentResource = pendingProps.get(currentProps), currentResource || (currentResource = {
              type: "style",
              instance: null,
              count: 0,
              state: null
            }, pendingProps.set(currentProps, currentResource)), currentResource) : { type: "void", instance: null, count: 0, state: null };
          case "link":
            if ("stylesheet" === pendingProps.rel && "string" === typeof pendingProps.href && "string" === typeof pendingProps.precedence) {
              type = getStyleKey(pendingProps.href);
              var styles$243 = getResourcesFromRoot(
                JSCompiler_inline_result
              ).hoistableStyles, resource$244 = styles$243.get(type);
              resource$244 || (JSCompiler_inline_result = JSCompiler_inline_result.ownerDocument || JSCompiler_inline_result, resource$244 = {
                type: "stylesheet",
                instance: null,
                count: 0,
                state: { loading: 0, preload: null }
              }, styles$243.set(type, resource$244), (styles$243 = JSCompiler_inline_result.querySelector(
                getStylesheetSelectorFromKey(type)
              )) && !styles$243._p && (resource$244.instance = styles$243, resource$244.state.loading = 5), preloadPropsMap.has(type) || (pendingProps = {
                rel: "preload",
                as: "style",
                href: pendingProps.href,
                crossOrigin: pendingProps.crossOrigin,
                integrity: pendingProps.integrity,
                media: pendingProps.media,
                hrefLang: pendingProps.hrefLang,
                referrerPolicy: pendingProps.referrerPolicy
              }, preloadPropsMap.set(type, pendingProps), styles$243 || preloadStylesheet(
                JSCompiler_inline_result,
                type,
                pendingProps,
                resource$244.state
              )));
              if (currentProps && null === currentResource)
                throw Error(formatProdErrorMessage(528, ""));
              return resource$244;
            }
            if (currentProps && null !== currentResource)
              throw Error(formatProdErrorMessage(529, ""));
            return null;
          case "script":
            return currentProps = pendingProps.async, pendingProps = pendingProps.src, "string" === typeof pendingProps && currentProps && "function" !== typeof currentProps && "symbol" !== typeof currentProps ? (currentProps = getScriptKey(pendingProps), pendingProps = getResourcesFromRoot(
              JSCompiler_inline_result
            ).hoistableScripts, currentResource = pendingProps.get(currentProps), currentResource || (currentResource = {
              type: "script",
              instance: null,
              count: 0,
              state: null
            }, pendingProps.set(currentProps, currentResource)), currentResource) : { type: "void", instance: null, count: 0, state: null };
          default:
            throw Error(formatProdErrorMessage(444, type));
        }
      }
      function getStyleKey(href) {
        return 'href="' + escapeSelectorAttributeValueInsideDoubleQuotes(href) + '"';
      }
      function getStylesheetSelectorFromKey(key) {
        return 'link[rel="stylesheet"][' + key + "]";
      }
      function stylesheetPropsFromRawProps(rawProps) {
        return assign({}, rawProps, {
          "data-precedence": rawProps.precedence,
          precedence: null
        });
      }
      function preloadStylesheet(ownerDocument, key, preloadProps, state) {
        ownerDocument.querySelector('link[rel="preload"][as="style"][' + key + "]") ? state.loading = 1 : (key = ownerDocument.createElement("link"), state.preload = key, key.addEventListener("load", function() {
          return state.loading |= 1;
        }), key.addEventListener("error", function() {
          return state.loading |= 2;
        }), setInitialProperties(key, "link", preloadProps), markNodeAsHoistable(key), ownerDocument.head.appendChild(key));
      }
      function getScriptKey(src) {
        return '[src="' + escapeSelectorAttributeValueInsideDoubleQuotes(src) + '"]';
      }
      function getScriptSelectorFromKey(key) {
        return "script[async]" + key;
      }
      function acquireResource(hoistableRoot, resource, props) {
        resource.count++;
        if (null === resource.instance)
          switch (resource.type) {
            case "style":
              var instance = hoistableRoot.querySelector(
                'style[data-href~="' + escapeSelectorAttributeValueInsideDoubleQuotes(props.href) + '"]'
              );
              if (instance)
                return resource.instance = instance, markNodeAsHoistable(instance), instance;
              var styleProps = assign({}, props, {
                "data-href": props.href,
                "data-precedence": props.precedence,
                href: null,
                precedence: null
              });
              instance = (hoistableRoot.ownerDocument || hoistableRoot).createElement(
                "style"
              );
              markNodeAsHoistable(instance);
              setInitialProperties(instance, "style", styleProps);
              insertStylesheet(instance, props.precedence, hoistableRoot);
              return resource.instance = instance;
            case "stylesheet":
              styleProps = getStyleKey(props.href);
              var instance$249 = hoistableRoot.querySelector(
                getStylesheetSelectorFromKey(styleProps)
              );
              if (instance$249)
                return resource.state.loading |= 4, resource.instance = instance$249, markNodeAsHoistable(instance$249), instance$249;
              instance = stylesheetPropsFromRawProps(props);
              (styleProps = preloadPropsMap.get(styleProps)) && adoptPreloadPropsForStylesheet(instance, styleProps);
              instance$249 = (hoistableRoot.ownerDocument || hoistableRoot).createElement("link");
              markNodeAsHoistable(instance$249);
              var linkInstance = instance$249;
              linkInstance._p = new Promise(function(resolve, reject) {
                linkInstance.onload = resolve;
                linkInstance.onerror = reject;
              });
              setInitialProperties(instance$249, "link", instance);
              resource.state.loading |= 4;
              insertStylesheet(instance$249, props.precedence, hoistableRoot);
              return resource.instance = instance$249;
            case "script":
              instance$249 = getScriptKey(props.src);
              if (styleProps = hoistableRoot.querySelector(
                getScriptSelectorFromKey(instance$249)
              ))
                return resource.instance = styleProps, markNodeAsHoistable(styleProps), styleProps;
              instance = props;
              if (styleProps = preloadPropsMap.get(instance$249))
                instance = assign({}, props), adoptPreloadPropsForScript(instance, styleProps);
              hoistableRoot = hoistableRoot.ownerDocument || hoistableRoot;
              styleProps = hoistableRoot.createElement("script");
              markNodeAsHoistable(styleProps);
              setInitialProperties(styleProps, "link", instance);
              hoistableRoot.head.appendChild(styleProps);
              return resource.instance = styleProps;
            case "void":
              return null;
            default:
              throw Error(formatProdErrorMessage(443, resource.type));
          }
        else
          "stylesheet" === resource.type && 0 === (resource.state.loading & 4) && (instance = resource.instance, resource.state.loading |= 4, insertStylesheet(instance, props.precedence, hoistableRoot));
        return resource.instance;
      }
      function insertStylesheet(instance, precedence, root2) {
        for (var nodes = root2.querySelectorAll(
          'link[rel="stylesheet"][data-precedence],style[data-precedence]'
        ), last = nodes.length ? nodes[nodes.length - 1] : null, prior = last, i = 0; i < nodes.length; i++) {
          var node = nodes[i];
          if (node.dataset.precedence === precedence) prior = node;
          else if (prior !== last) break;
        }
        prior ? prior.parentNode.insertBefore(instance, prior.nextSibling) : (precedence = 9 === root2.nodeType ? root2.head : root2, precedence.insertBefore(instance, precedence.firstChild));
      }
      function adoptPreloadPropsForStylesheet(stylesheetProps, preloadProps) {
        null == stylesheetProps.crossOrigin && (stylesheetProps.crossOrigin = preloadProps.crossOrigin);
        null == stylesheetProps.referrerPolicy && (stylesheetProps.referrerPolicy = preloadProps.referrerPolicy);
        null == stylesheetProps.title && (stylesheetProps.title = preloadProps.title);
      }
      function adoptPreloadPropsForScript(scriptProps, preloadProps) {
        null == scriptProps.crossOrigin && (scriptProps.crossOrigin = preloadProps.crossOrigin);
        null == scriptProps.referrerPolicy && (scriptProps.referrerPolicy = preloadProps.referrerPolicy);
        null == scriptProps.integrity && (scriptProps.integrity = preloadProps.integrity);
      }
      var tagCaches = null;
      function getHydratableHoistableCache(type, keyAttribute, ownerDocument) {
        if (null === tagCaches) {
          var cache = /* @__PURE__ */ new Map();
          var caches = tagCaches = /* @__PURE__ */ new Map();
          caches.set(ownerDocument, cache);
        } else
          caches = tagCaches, cache = caches.get(ownerDocument), cache || (cache = /* @__PURE__ */ new Map(), caches.set(ownerDocument, cache));
        if (cache.has(type)) return cache;
        cache.set(type, null);
        ownerDocument = ownerDocument.getElementsByTagName(type);
        for (caches = 0; caches < ownerDocument.length; caches++) {
          var node = ownerDocument[caches];
          if (!(node[internalHoistableMarker] || node[internalInstanceKey] || "link" === type && "stylesheet" === node.getAttribute("rel")) && "http://www.w3.org/2000/svg" !== node.namespaceURI) {
            var nodeKey = node.getAttribute(keyAttribute) || "";
            nodeKey = type + nodeKey;
            var existing = cache.get(nodeKey);
            existing ? existing.push(node) : cache.set(nodeKey, [node]);
          }
        }
        return cache;
      }
      function mountHoistable(hoistableRoot, type, instance) {
        hoistableRoot = hoistableRoot.ownerDocument || hoistableRoot;
        hoistableRoot.head.insertBefore(
          instance,
          "title" === type ? hoistableRoot.querySelector("head > title") : null
        );
      }
      function isHostHoistableType(type, props, hostContext) {
        if (1 === hostContext || null != props.itemProp) return false;
        switch (type) {
          case "meta":
          case "title":
            return true;
          case "style":
            if ("string" !== typeof props.precedence || "string" !== typeof props.href || "" === props.href)
              break;
            return true;
          case "link":
            if ("string" !== typeof props.rel || "string" !== typeof props.href || "" === props.href || props.onLoad || props.onError)
              break;
            switch (props.rel) {
              case "stylesheet":
                return type = props.disabled, "string" === typeof props.precedence && null == type;
              default:
                return true;
            }
          case "script":
            if (props.async && "function" !== typeof props.async && "symbol" !== typeof props.async && !props.onLoad && !props.onError && props.src && "string" === typeof props.src)
              return true;
        }
        return false;
      }
      function preloadResource(resource) {
        return "stylesheet" === resource.type && 0 === (resource.state.loading & 3) ? false : true;
      }
      function suspendResource(state, hoistableRoot, resource, props) {
        if ("stylesheet" === resource.type && ("string" !== typeof props.media || false !== matchMedia(props.media).matches) && 0 === (resource.state.loading & 4)) {
          if (null === resource.instance) {
            var key = getStyleKey(props.href), instance = hoistableRoot.querySelector(
              getStylesheetSelectorFromKey(key)
            );
            if (instance) {
              hoistableRoot = instance._p;
              null !== hoistableRoot && "object" === typeof hoistableRoot && "function" === typeof hoistableRoot.then && (state.count++, state = onUnsuspend.bind(state), hoistableRoot.then(state, state));
              resource.state.loading |= 4;
              resource.instance = instance;
              markNodeAsHoistable(instance);
              return;
            }
            instance = hoistableRoot.ownerDocument || hoistableRoot;
            props = stylesheetPropsFromRawProps(props);
            (key = preloadPropsMap.get(key)) && adoptPreloadPropsForStylesheet(props, key);
            instance = instance.createElement("link");
            markNodeAsHoistable(instance);
            var linkInstance = instance;
            linkInstance._p = new Promise(function(resolve, reject) {
              linkInstance.onload = resolve;
              linkInstance.onerror = reject;
            });
            setInitialProperties(instance, "link", props);
            resource.instance = instance;
          }
          null === state.stylesheets && (state.stylesheets = /* @__PURE__ */ new Map());
          state.stylesheets.set(resource, hoistableRoot);
          (hoistableRoot = resource.state.preload) && 0 === (resource.state.loading & 3) && (state.count++, resource = onUnsuspend.bind(state), hoistableRoot.addEventListener("load", resource), hoistableRoot.addEventListener("error", resource));
        }
      }
      var estimatedBytesWithinLimit = 0;
      function waitForCommitToBeReady(state, timeoutOffset) {
        state.stylesheets && 0 === state.count && insertSuspendedStylesheets(state, state.stylesheets);
        return 0 < state.count || 0 < state.imgCount ? function(commit) {
          var stylesheetTimer = setTimeout(function() {
            state.stylesheets && insertSuspendedStylesheets(state, state.stylesheets);
            if (state.unsuspend) {
              var unsuspend = state.unsuspend;
              state.unsuspend = null;
              unsuspend();
            }
          }, 6e4 + timeoutOffset);
          0 < state.imgBytes && 0 === estimatedBytesWithinLimit && (estimatedBytesWithinLimit = 62500 * estimateBandwidth());
          var imgTimer = setTimeout(
            function() {
              state.waitingForImages = false;
              if (0 === state.count && (state.stylesheets && insertSuspendedStylesheets(state, state.stylesheets), state.unsuspend)) {
                var unsuspend = state.unsuspend;
                state.unsuspend = null;
                unsuspend();
              }
            },
            (state.imgBytes > estimatedBytesWithinLimit ? 50 : 800) + timeoutOffset
          );
          state.unsuspend = commit;
          return function() {
            state.unsuspend = null;
            clearTimeout(stylesheetTimer);
            clearTimeout(imgTimer);
          };
        } : null;
      }
      function onUnsuspend() {
        this.count--;
        if (0 === this.count && (0 === this.imgCount || !this.waitingForImages)) {
          if (this.stylesheets) insertSuspendedStylesheets(this, this.stylesheets);
          else if (this.unsuspend) {
            var unsuspend = this.unsuspend;
            this.unsuspend = null;
            unsuspend();
          }
        }
      }
      var precedencesByRoot = null;
      function insertSuspendedStylesheets(state, resources) {
        state.stylesheets = null;
        null !== state.unsuspend && (state.count++, precedencesByRoot = /* @__PURE__ */ new Map(), resources.forEach(insertStylesheetIntoRoot, state), precedencesByRoot = null, onUnsuspend.call(state));
      }
      function insertStylesheetIntoRoot(root2, resource) {
        if (!(resource.state.loading & 4)) {
          var precedences = precedencesByRoot.get(root2);
          if (precedences) var last = precedences.get(null);
          else {
            precedences = /* @__PURE__ */ new Map();
            precedencesByRoot.set(root2, precedences);
            for (var nodes = root2.querySelectorAll(
              "link[data-precedence],style[data-precedence]"
            ), i = 0; i < nodes.length; i++) {
              var node = nodes[i];
              if ("LINK" === node.nodeName || "not all" !== node.getAttribute("media"))
                precedences.set(node.dataset.precedence, node), last = node;
            }
            last && precedences.set(null, last);
          }
          nodes = resource.instance;
          node = nodes.getAttribute("data-precedence");
          i = precedences.get(node) || last;
          i === last && precedences.set(null, nodes);
          precedences.set(node, nodes);
          this.count++;
          last = onUnsuspend.bind(this);
          nodes.addEventListener("load", last);
          nodes.addEventListener("error", last);
          i ? i.parentNode.insertBefore(nodes, i.nextSibling) : (root2 = 9 === root2.nodeType ? root2.head : root2, root2.insertBefore(nodes, root2.firstChild));
          resource.state.loading |= 4;
        }
      }
      var HostTransitionContext = {
        $$typeof: REACT_CONTEXT_TYPE,
        Provider: null,
        Consumer: null,
        _currentValue: sharedNotPendingObject,
        _currentValue2: sharedNotPendingObject,
        _threadCount: 0
      };
      function FiberRootNode(containerInfo, tag, hydrate, identifierPrefix, onUncaughtError, onCaughtError, onRecoverableError, onDefaultTransitionIndicator, formState) {
        this.tag = 1;
        this.containerInfo = containerInfo;
        this.pingCache = this.current = this.pendingChildren = null;
        this.timeoutHandle = -1;
        this.callbackNode = this.next = this.pendingContext = this.context = this.cancelPendingCommit = null;
        this.callbackPriority = 0;
        this.expirationTimes = createLaneMap(-1);
        this.entangledLanes = this.shellSuspendCounter = this.errorRecoveryDisabledLanes = this.expiredLanes = this.warmLanes = this.pingedLanes = this.suspendedLanes = this.pendingLanes = 0;
        this.entanglements = createLaneMap(0);
        this.hiddenUpdates = createLaneMap(null);
        this.identifierPrefix = identifierPrefix;
        this.onUncaughtError = onUncaughtError;
        this.onCaughtError = onCaughtError;
        this.onRecoverableError = onRecoverableError;
        this.pooledCache = null;
        this.pooledCacheLanes = 0;
        this.formState = formState;
        this.incompleteTransitions = /* @__PURE__ */ new Map();
      }
      function createFiberRoot(containerInfo, tag, hydrate, initialChildren, hydrationCallbacks, isStrictMode, identifierPrefix, formState, onUncaughtError, onCaughtError, onRecoverableError, onDefaultTransitionIndicator) {
        containerInfo = new FiberRootNode(
          containerInfo,
          tag,
          hydrate,
          identifierPrefix,
          onUncaughtError,
          onCaughtError,
          onRecoverableError,
          onDefaultTransitionIndicator,
          formState
        );
        tag = 1;
        true === isStrictMode && (tag |= 24);
        isStrictMode = createFiberImplClass(3, null, null, tag);
        containerInfo.current = isStrictMode;
        isStrictMode.stateNode = containerInfo;
        tag = createCache();
        tag.refCount++;
        containerInfo.pooledCache = tag;
        tag.refCount++;
        isStrictMode.memoizedState = {
          element: initialChildren,
          isDehydrated: hydrate,
          cache: tag
        };
        initializeUpdateQueue(isStrictMode);
        return containerInfo;
      }
      function getContextForSubtree(parentComponent) {
        if (!parentComponent) return emptyContextObject;
        parentComponent = emptyContextObject;
        return parentComponent;
      }
      function updateContainerImpl(rootFiber, lane, element, container, parentComponent, callback) {
        parentComponent = getContextForSubtree(parentComponent);
        null === container.context ? container.context = parentComponent : container.pendingContext = parentComponent;
        container = createUpdate(lane);
        container.payload = { element };
        callback = void 0 === callback ? null : callback;
        null !== callback && (container.callback = callback);
        element = enqueueUpdate(rootFiber, container, lane);
        null !== element && (scheduleUpdateOnFiber(element, rootFiber, lane), entangleTransitions(element, rootFiber, lane));
      }
      function markRetryLaneImpl(fiber, retryLane) {
        fiber = fiber.memoizedState;
        if (null !== fiber && null !== fiber.dehydrated) {
          var a = fiber.retryLane;
          fiber.retryLane = 0 !== a && a < retryLane ? a : retryLane;
        }
      }
      function markRetryLaneIfNotHydrated(fiber, retryLane) {
        markRetryLaneImpl(fiber, retryLane);
        (fiber = fiber.alternate) && markRetryLaneImpl(fiber, retryLane);
      }
      function attemptContinuousHydration(fiber) {
        if (13 === fiber.tag || 31 === fiber.tag) {
          var root2 = enqueueConcurrentRenderForLane(fiber, 67108864);
          null !== root2 && scheduleUpdateOnFiber(root2, fiber, 67108864);
          markRetryLaneIfNotHydrated(fiber, 67108864);
        }
      }
      function attemptHydrationAtCurrentPriority(fiber) {
        if (13 === fiber.tag || 31 === fiber.tag) {
          var lane = requestUpdateLane();
          lane = getBumpedLaneForHydrationByLane(lane);
          var root2 = enqueueConcurrentRenderForLane(fiber, lane);
          null !== root2 && scheduleUpdateOnFiber(root2, fiber, lane);
          markRetryLaneIfNotHydrated(fiber, lane);
        }
      }
      var _enabled = true;
      function dispatchDiscreteEvent(domEventName, eventSystemFlags, container, nativeEvent) {
        var prevTransition = ReactSharedInternals.T;
        ReactSharedInternals.T = null;
        var previousPriority = ReactDOMSharedInternals.p;
        try {
          ReactDOMSharedInternals.p = 2, dispatchEvent(domEventName, eventSystemFlags, container, nativeEvent);
        } finally {
          ReactDOMSharedInternals.p = previousPriority, ReactSharedInternals.T = prevTransition;
        }
      }
      function dispatchContinuousEvent(domEventName, eventSystemFlags, container, nativeEvent) {
        var prevTransition = ReactSharedInternals.T;
        ReactSharedInternals.T = null;
        var previousPriority = ReactDOMSharedInternals.p;
        try {
          ReactDOMSharedInternals.p = 8, dispatchEvent(domEventName, eventSystemFlags, container, nativeEvent);
        } finally {
          ReactDOMSharedInternals.p = previousPriority, ReactSharedInternals.T = prevTransition;
        }
      }
      function dispatchEvent(domEventName, eventSystemFlags, targetContainer, nativeEvent) {
        if (_enabled) {
          var blockedOn = findInstanceBlockingEvent(nativeEvent);
          if (null === blockedOn)
            dispatchEventForPluginEventSystem(
              domEventName,
              eventSystemFlags,
              nativeEvent,
              return_targetInst,
              targetContainer
            ), clearIfContinuousEvent(domEventName, nativeEvent);
          else if (queueIfContinuousEvent(
            blockedOn,
            domEventName,
            eventSystemFlags,
            targetContainer,
            nativeEvent
          ))
            nativeEvent.stopPropagation();
          else if (clearIfContinuousEvent(domEventName, nativeEvent), eventSystemFlags & 4 && -1 < discreteReplayableEvents.indexOf(domEventName)) {
            for (; null !== blockedOn; ) {
              var fiber = getInstanceFromNode(blockedOn);
              if (null !== fiber)
                switch (fiber.tag) {
                  case 3:
                    fiber = fiber.stateNode;
                    if (fiber.current.memoizedState.isDehydrated) {
                      var lanes = getHighestPriorityLanes(fiber.pendingLanes);
                      if (0 !== lanes) {
                        var root2 = fiber;
                        root2.pendingLanes |= 2;
                        for (root2.entangledLanes |= 2; lanes; ) {
                          var lane = 1 << 31 - clz32(lanes);
                          root2.entanglements[1] |= lane;
                          lanes &= ~lane;
                        }
                        ensureRootIsScheduled(fiber);
                        0 === (executionContext & 6) && (workInProgressRootRenderTargetTime = now() + 500, flushSyncWorkAcrossRoots_impl(0, false));
                      }
                    }
                    break;
                  case 31:
                  case 13:
                    root2 = enqueueConcurrentRenderForLane(fiber, 2), null !== root2 && scheduleUpdateOnFiber(root2, fiber, 2), flushSyncWork$1(), markRetryLaneIfNotHydrated(fiber, 2);
                }
              fiber = findInstanceBlockingEvent(nativeEvent);
              null === fiber && dispatchEventForPluginEventSystem(
                domEventName,
                eventSystemFlags,
                nativeEvent,
                return_targetInst,
                targetContainer
              );
              if (fiber === blockedOn) break;
              blockedOn = fiber;
            }
            null !== blockedOn && nativeEvent.stopPropagation();
          } else
            dispatchEventForPluginEventSystem(
              domEventName,
              eventSystemFlags,
              nativeEvent,
              null,
              targetContainer
            );
        }
      }
      function findInstanceBlockingEvent(nativeEvent) {
        nativeEvent = getEventTarget(nativeEvent);
        return findInstanceBlockingTarget(nativeEvent);
      }
      var return_targetInst = null;
      function findInstanceBlockingTarget(targetNode) {
        return_targetInst = null;
        targetNode = getClosestInstanceFromNode(targetNode);
        if (null !== targetNode) {
          var nearestMounted = getNearestMountedFiber(targetNode);
          if (null === nearestMounted) targetNode = null;
          else {
            var tag = nearestMounted.tag;
            if (13 === tag) {
              targetNode = getSuspenseInstanceFromFiber(nearestMounted);
              if (null !== targetNode) return targetNode;
              targetNode = null;
            } else if (31 === tag) {
              targetNode = getActivityInstanceFromFiber(nearestMounted);
              if (null !== targetNode) return targetNode;
              targetNode = null;
            } else if (3 === tag) {
              if (nearestMounted.stateNode.current.memoizedState.isDehydrated)
                return 3 === nearestMounted.tag ? nearestMounted.stateNode.containerInfo : null;
              targetNode = null;
            } else nearestMounted !== targetNode && (targetNode = null);
          }
        }
        return_targetInst = targetNode;
        return null;
      }
      function getEventPriority(domEventName) {
        switch (domEventName) {
          case "beforetoggle":
          case "cancel":
          case "click":
          case "close":
          case "contextmenu":
          case "copy":
          case "cut":
          case "auxclick":
          case "dblclick":
          case "dragend":
          case "dragstart":
          case "drop":
          case "focusin":
          case "focusout":
          case "input":
          case "invalid":
          case "keydown":
          case "keypress":
          case "keyup":
          case "mousedown":
          case "mouseup":
          case "paste":
          case "pause":
          case "play":
          case "pointercancel":
          case "pointerdown":
          case "pointerup":
          case "ratechange":
          case "reset":
          case "resize":
          case "seeked":
          case "submit":
          case "toggle":
          case "touchcancel":
          case "touchend":
          case "touchstart":
          case "volumechange":
          case "change":
          case "selectionchange":
          case "textInput":
          case "compositionstart":
          case "compositionend":
          case "compositionupdate":
          case "beforeblur":
          case "afterblur":
          case "beforeinput":
          case "blur":
          case "fullscreenchange":
          case "focus":
          case "hashchange":
          case "popstate":
          case "select":
          case "selectstart":
            return 2;
          case "drag":
          case "dragenter":
          case "dragexit":
          case "dragleave":
          case "dragover":
          case "mousemove":
          case "mouseout":
          case "mouseover":
          case "pointermove":
          case "pointerout":
          case "pointerover":
          case "scroll":
          case "touchmove":
          case "wheel":
          case "mouseenter":
          case "mouseleave":
          case "pointerenter":
          case "pointerleave":
            return 8;
          case "message":
            switch (getCurrentPriorityLevel()) {
              case ImmediatePriority:
                return 2;
              case UserBlockingPriority:
                return 8;
              case NormalPriority$1:
              case LowPriority:
                return 32;
              case IdlePriority:
                return 268435456;
              default:
                return 32;
            }
          default:
            return 32;
        }
      }
      var hasScheduledReplayAttempt = false;
      var queuedFocus = null;
      var queuedDrag = null;
      var queuedMouse = null;
      var queuedPointers = /* @__PURE__ */ new Map();
      var queuedPointerCaptures = /* @__PURE__ */ new Map();
      var queuedExplicitHydrationTargets = [];
      var discreteReplayableEvents = "mousedown mouseup touchcancel touchend touchstart auxclick dblclick pointercancel pointerdown pointerup dragend dragstart drop compositionend compositionstart keydown keypress keyup input textInput copy cut paste click change contextmenu reset".split(
        " "
      );
      function clearIfContinuousEvent(domEventName, nativeEvent) {
        switch (domEventName) {
          case "focusin":
          case "focusout":
            queuedFocus = null;
            break;
          case "dragenter":
          case "dragleave":
            queuedDrag = null;
            break;
          case "mouseover":
          case "mouseout":
            queuedMouse = null;
            break;
          case "pointerover":
          case "pointerout":
            queuedPointers.delete(nativeEvent.pointerId);
            break;
          case "gotpointercapture":
          case "lostpointercapture":
            queuedPointerCaptures.delete(nativeEvent.pointerId);
        }
      }
      function accumulateOrCreateContinuousQueuedReplayableEvent(existingQueuedEvent, blockedOn, domEventName, eventSystemFlags, targetContainer, nativeEvent) {
        if (null === existingQueuedEvent || existingQueuedEvent.nativeEvent !== nativeEvent)
          return existingQueuedEvent = {
            blockedOn,
            domEventName,
            eventSystemFlags,
            nativeEvent,
            targetContainers: [targetContainer]
          }, null !== blockedOn && (blockedOn = getInstanceFromNode(blockedOn), null !== blockedOn && attemptContinuousHydration(blockedOn)), existingQueuedEvent;
        existingQueuedEvent.eventSystemFlags |= eventSystemFlags;
        blockedOn = existingQueuedEvent.targetContainers;
        null !== targetContainer && -1 === blockedOn.indexOf(targetContainer) && blockedOn.push(targetContainer);
        return existingQueuedEvent;
      }
      function queueIfContinuousEvent(blockedOn, domEventName, eventSystemFlags, targetContainer, nativeEvent) {
        switch (domEventName) {
          case "focusin":
            return queuedFocus = accumulateOrCreateContinuousQueuedReplayableEvent(
              queuedFocus,
              blockedOn,
              domEventName,
              eventSystemFlags,
              targetContainer,
              nativeEvent
            ), true;
          case "dragenter":
            return queuedDrag = accumulateOrCreateContinuousQueuedReplayableEvent(
              queuedDrag,
              blockedOn,
              domEventName,
              eventSystemFlags,
              targetContainer,
              nativeEvent
            ), true;
          case "mouseover":
            return queuedMouse = accumulateOrCreateContinuousQueuedReplayableEvent(
              queuedMouse,
              blockedOn,
              domEventName,
              eventSystemFlags,
              targetContainer,
              nativeEvent
            ), true;
          case "pointerover":
            var pointerId = nativeEvent.pointerId;
            queuedPointers.set(
              pointerId,
              accumulateOrCreateContinuousQueuedReplayableEvent(
                queuedPointers.get(pointerId) || null,
                blockedOn,
                domEventName,
                eventSystemFlags,
                targetContainer,
                nativeEvent
              )
            );
            return true;
          case "gotpointercapture":
            return pointerId = nativeEvent.pointerId, queuedPointerCaptures.set(
              pointerId,
              accumulateOrCreateContinuousQueuedReplayableEvent(
                queuedPointerCaptures.get(pointerId) || null,
                blockedOn,
                domEventName,
                eventSystemFlags,
                targetContainer,
                nativeEvent
              )
            ), true;
        }
        return false;
      }
      function attemptExplicitHydrationTarget(queuedTarget) {
        var targetInst = getClosestInstanceFromNode(queuedTarget.target);
        if (null !== targetInst) {
          var nearestMounted = getNearestMountedFiber(targetInst);
          if (null !== nearestMounted) {
            if (targetInst = nearestMounted.tag, 13 === targetInst) {
              if (targetInst = getSuspenseInstanceFromFiber(nearestMounted), null !== targetInst) {
                queuedTarget.blockedOn = targetInst;
                runWithPriority(queuedTarget.priority, function() {
                  attemptHydrationAtCurrentPriority(nearestMounted);
                });
                return;
              }
            } else if (31 === targetInst) {
              if (targetInst = getActivityInstanceFromFiber(nearestMounted), null !== targetInst) {
                queuedTarget.blockedOn = targetInst;
                runWithPriority(queuedTarget.priority, function() {
                  attemptHydrationAtCurrentPriority(nearestMounted);
                });
                return;
              }
            } else if (3 === targetInst && nearestMounted.stateNode.current.memoizedState.isDehydrated) {
              queuedTarget.blockedOn = 3 === nearestMounted.tag ? nearestMounted.stateNode.containerInfo : null;
              return;
            }
          }
        }
        queuedTarget.blockedOn = null;
      }
      function attemptReplayContinuousQueuedEvent(queuedEvent) {
        if (null !== queuedEvent.blockedOn) return false;
        for (var targetContainers = queuedEvent.targetContainers; 0 < targetContainers.length; ) {
          var nextBlockedOn = findInstanceBlockingEvent(queuedEvent.nativeEvent);
          if (null === nextBlockedOn) {
            nextBlockedOn = queuedEvent.nativeEvent;
            var nativeEventClone = new nextBlockedOn.constructor(
              nextBlockedOn.type,
              nextBlockedOn
            );
            currentReplayingEvent = nativeEventClone;
            nextBlockedOn.target.dispatchEvent(nativeEventClone);
            currentReplayingEvent = null;
          } else
            return targetContainers = getInstanceFromNode(nextBlockedOn), null !== targetContainers && attemptContinuousHydration(targetContainers), queuedEvent.blockedOn = nextBlockedOn, false;
          targetContainers.shift();
        }
        return true;
      }
      function attemptReplayContinuousQueuedEventInMap(queuedEvent, key, map) {
        attemptReplayContinuousQueuedEvent(queuedEvent) && map.delete(key);
      }
      function replayUnblockedEvents() {
        hasScheduledReplayAttempt = false;
        null !== queuedFocus && attemptReplayContinuousQueuedEvent(queuedFocus) && (queuedFocus = null);
        null !== queuedDrag && attemptReplayContinuousQueuedEvent(queuedDrag) && (queuedDrag = null);
        null !== queuedMouse && attemptReplayContinuousQueuedEvent(queuedMouse) && (queuedMouse = null);
        queuedPointers.forEach(attemptReplayContinuousQueuedEventInMap);
        queuedPointerCaptures.forEach(attemptReplayContinuousQueuedEventInMap);
      }
      function scheduleCallbackIfUnblocked(queuedEvent, unblocked) {
        queuedEvent.blockedOn === unblocked && (queuedEvent.blockedOn = null, hasScheduledReplayAttempt || (hasScheduledReplayAttempt = true, Scheduler.unstable_scheduleCallback(
          Scheduler.unstable_NormalPriority,
          replayUnblockedEvents
        )));
      }
      var lastScheduledReplayQueue = null;
      function scheduleReplayQueueIfNeeded(formReplayingQueue) {
        lastScheduledReplayQueue !== formReplayingQueue && (lastScheduledReplayQueue = formReplayingQueue, Scheduler.unstable_scheduleCallback(
          Scheduler.unstable_NormalPriority,
          function() {
            lastScheduledReplayQueue === formReplayingQueue && (lastScheduledReplayQueue = null);
            for (var i = 0; i < formReplayingQueue.length; i += 3) {
              var form = formReplayingQueue[i], submitterOrAction = formReplayingQueue[i + 1], formData = formReplayingQueue[i + 2];
              if ("function" !== typeof submitterOrAction)
                if (null === findInstanceBlockingTarget(submitterOrAction || form))
                  continue;
                else break;
              var formInst = getInstanceFromNode(form);
              null !== formInst && (formReplayingQueue.splice(i, 3), i -= 3, startHostTransition(
                formInst,
                {
                  pending: true,
                  data: formData,
                  method: form.method,
                  action: submitterOrAction
                },
                submitterOrAction,
                formData
              ));
            }
          }
        ));
      }
      function retryIfBlockedOn(unblocked) {
        function unblock(queuedEvent) {
          return scheduleCallbackIfUnblocked(queuedEvent, unblocked);
        }
        null !== queuedFocus && scheduleCallbackIfUnblocked(queuedFocus, unblocked);
        null !== queuedDrag && scheduleCallbackIfUnblocked(queuedDrag, unblocked);
        null !== queuedMouse && scheduleCallbackIfUnblocked(queuedMouse, unblocked);
        queuedPointers.forEach(unblock);
        queuedPointerCaptures.forEach(unblock);
        for (var i = 0; i < queuedExplicitHydrationTargets.length; i++) {
          var queuedTarget = queuedExplicitHydrationTargets[i];
          queuedTarget.blockedOn === unblocked && (queuedTarget.blockedOn = null);
        }
        for (; 0 < queuedExplicitHydrationTargets.length && (i = queuedExplicitHydrationTargets[0], null === i.blockedOn); )
          attemptExplicitHydrationTarget(i), null === i.blockedOn && queuedExplicitHydrationTargets.shift();
        i = (unblocked.ownerDocument || unblocked).$$reactFormReplay;
        if (null != i)
          for (queuedTarget = 0; queuedTarget < i.length; queuedTarget += 3) {
            var form = i[queuedTarget], submitterOrAction = i[queuedTarget + 1], formProps = form[internalPropsKey] || null;
            if ("function" === typeof submitterOrAction)
              formProps || scheduleReplayQueueIfNeeded(i);
            else if (formProps) {
              var action = null;
              if (submitterOrAction && submitterOrAction.hasAttribute("formAction"))
                if (form = submitterOrAction, formProps = submitterOrAction[internalPropsKey] || null)
                  action = formProps.formAction;
                else {
                  if (null !== findInstanceBlockingTarget(form)) continue;
                }
              else action = formProps.action;
              "function" === typeof action ? i[queuedTarget + 1] = action : (i.splice(queuedTarget, 3), queuedTarget -= 3);
              scheduleReplayQueueIfNeeded(i);
            }
          }
      }
      function defaultOnDefaultTransitionIndicator() {
        function handleNavigate(event) {
          event.canIntercept && "react-transition" === event.info && event.intercept({
            handler: function() {
              return new Promise(function(resolve) {
                return pendingResolve = resolve;
              });
            },
            focusReset: "manual",
            scroll: "manual"
          });
        }
        function handleNavigateComplete() {
          null !== pendingResolve && (pendingResolve(), pendingResolve = null);
          isCancelled || setTimeout(startFakeNavigation, 20);
        }
        function startFakeNavigation() {
          if (!isCancelled && !navigation.transition) {
            var currentEntry = navigation.currentEntry;
            currentEntry && null != currentEntry.url && navigation.navigate(currentEntry.url, {
              state: currentEntry.getState(),
              info: "react-transition",
              history: "replace"
            });
          }
        }
        if ("object" === typeof navigation) {
          var isCancelled = false, pendingResolve = null;
          navigation.addEventListener("navigate", handleNavigate);
          navigation.addEventListener("navigatesuccess", handleNavigateComplete);
          navigation.addEventListener("navigateerror", handleNavigateComplete);
          setTimeout(startFakeNavigation, 100);
          return function() {
            isCancelled = true;
            navigation.removeEventListener("navigate", handleNavigate);
            navigation.removeEventListener("navigatesuccess", handleNavigateComplete);
            navigation.removeEventListener("navigateerror", handleNavigateComplete);
            null !== pendingResolve && (pendingResolve(), pendingResolve = null);
          };
        }
      }
      function ReactDOMRoot(internalRoot) {
        this._internalRoot = internalRoot;
      }
      ReactDOMHydrationRoot.prototype.render = ReactDOMRoot.prototype.render = function(children) {
        var root2 = this._internalRoot;
        if (null === root2) throw Error(formatProdErrorMessage(409));
        var current = root2.current, lane = requestUpdateLane();
        updateContainerImpl(current, lane, children, root2, null, null);
      };
      ReactDOMHydrationRoot.prototype.unmount = ReactDOMRoot.prototype.unmount = function() {
        var root2 = this._internalRoot;
        if (null !== root2) {
          this._internalRoot = null;
          var container = root2.containerInfo;
          updateContainerImpl(root2.current, 2, null, root2, null, null);
          flushSyncWork$1();
          container[internalContainerInstanceKey] = null;
        }
      };
      function ReactDOMHydrationRoot(internalRoot) {
        this._internalRoot = internalRoot;
      }
      ReactDOMHydrationRoot.prototype.unstable_scheduleHydration = function(target) {
        if (target) {
          var updatePriority = resolveUpdatePriority();
          target = { blockedOn: null, target, priority: updatePriority };
          for (var i = 0; i < queuedExplicitHydrationTargets.length && 0 !== updatePriority && updatePriority < queuedExplicitHydrationTargets[i].priority; i++) ;
          queuedExplicitHydrationTargets.splice(i, 0, target);
          0 === i && attemptExplicitHydrationTarget(target);
        }
      };
      var isomorphicReactPackageVersion$jscomp$inline_1840 = React3.version;
      if ("19.2.7" !== isomorphicReactPackageVersion$jscomp$inline_1840)
        throw Error(
          formatProdErrorMessage(
            527,
            isomorphicReactPackageVersion$jscomp$inline_1840,
            "19.2.7"
          )
        );
      ReactDOMSharedInternals.findDOMNode = function(componentOrElement) {
        var fiber = componentOrElement._reactInternals;
        if (void 0 === fiber) {
          if ("function" === typeof componentOrElement.render)
            throw Error(formatProdErrorMessage(188));
          componentOrElement = Object.keys(componentOrElement).join(",");
          throw Error(formatProdErrorMessage(268, componentOrElement));
        }
        componentOrElement = findCurrentFiberUsingSlowPath(fiber);
        componentOrElement = null !== componentOrElement ? findCurrentHostFiberImpl(componentOrElement) : null;
        componentOrElement = null === componentOrElement ? null : componentOrElement.stateNode;
        return componentOrElement;
      };
      var internals$jscomp$inline_2347 = {
        bundleType: 0,
        version: "19.2.7",
        rendererPackageName: "react-dom",
        currentDispatcherRef: ReactSharedInternals,
        reconcilerVersion: "19.2.7"
      };
      if ("undefined" !== typeof __REACT_DEVTOOLS_GLOBAL_HOOK__) {
        hook$jscomp$inline_2348 = __REACT_DEVTOOLS_GLOBAL_HOOK__;
        if (!hook$jscomp$inline_2348.isDisabled && hook$jscomp$inline_2348.supportsFiber)
          try {
            rendererID = hook$jscomp$inline_2348.inject(
              internals$jscomp$inline_2347
            ), injectedHook = hook$jscomp$inline_2348;
          } catch (err) {
          }
      }
      var hook$jscomp$inline_2348;
      exports.createRoot = function(container, options2) {
        if (!isValidContainer(container)) throw Error(formatProdErrorMessage(299));
        var isStrictMode = false, identifierPrefix = "", onUncaughtError = defaultOnUncaughtError, onCaughtError = defaultOnCaughtError, onRecoverableError = defaultOnRecoverableError;
        null !== options2 && void 0 !== options2 && (true === options2.unstable_strictMode && (isStrictMode = true), void 0 !== options2.identifierPrefix && (identifierPrefix = options2.identifierPrefix), void 0 !== options2.onUncaughtError && (onUncaughtError = options2.onUncaughtError), void 0 !== options2.onCaughtError && (onCaughtError = options2.onCaughtError), void 0 !== options2.onRecoverableError && (onRecoverableError = options2.onRecoverableError));
        options2 = createFiberRoot(
          container,
          1,
          false,
          null,
          null,
          isStrictMode,
          identifierPrefix,
          null,
          onUncaughtError,
          onCaughtError,
          onRecoverableError,
          defaultOnDefaultTransitionIndicator
        );
        container[internalContainerInstanceKey] = options2.current;
        listenToAllSupportedEvents(container);
        return new ReactDOMRoot(options2);
      };
      exports.hydrateRoot = function(container, initialChildren, options2) {
        if (!isValidContainer(container)) throw Error(formatProdErrorMessage(299));
        var isStrictMode = false, identifierPrefix = "", onUncaughtError = defaultOnUncaughtError, onCaughtError = defaultOnCaughtError, onRecoverableError = defaultOnRecoverableError, formState = null;
        null !== options2 && void 0 !== options2 && (true === options2.unstable_strictMode && (isStrictMode = true), void 0 !== options2.identifierPrefix && (identifierPrefix = options2.identifierPrefix), void 0 !== options2.onUncaughtError && (onUncaughtError = options2.onUncaughtError), void 0 !== options2.onCaughtError && (onCaughtError = options2.onCaughtError), void 0 !== options2.onRecoverableError && (onRecoverableError = options2.onRecoverableError), void 0 !== options2.formState && (formState = options2.formState));
        initialChildren = createFiberRoot(
          container,
          1,
          true,
          initialChildren,
          null != options2 ? options2 : null,
          isStrictMode,
          identifierPrefix,
          formState,
          onUncaughtError,
          onCaughtError,
          onRecoverableError,
          defaultOnDefaultTransitionIndicator
        );
        initialChildren.context = getContextForSubtree(null);
        options2 = initialChildren.current;
        isStrictMode = requestUpdateLane();
        isStrictMode = getBumpedLaneForHydrationByLane(isStrictMode);
        identifierPrefix = createUpdate(isStrictMode);
        identifierPrefix.callback = null;
        enqueueUpdate(options2, identifierPrefix, isStrictMode);
        options2 = isStrictMode;
        initialChildren.current.lanes = options2;
        markRootUpdated$1(initialChildren, options2);
        ensureRootIsScheduled(initialChildren);
        container[internalContainerInstanceKey] = initialChildren.current;
        listenToAllSupportedEvents(container);
        return new ReactDOMHydrationRoot(initialChildren);
      };
      exports.version = "19.2.7";
    }
  });

  // node_modules/react-dom/client.js
  var require_client = __commonJS({
    "node_modules/react-dom/client.js"(exports, module) {
      "use strict";
      function checkDCE() {
        if (typeof __REACT_DEVTOOLS_GLOBAL_HOOK__ === "undefined" || typeof __REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE !== "function") {
          return;
        }
        if (false) {
          throw new Error("^_^");
        }
        try {
          __REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE(checkDCE);
        } catch (err) {
          console.error(err);
        }
      }
      if (true) {
        checkDCE();
        module.exports = require_react_dom_client_production();
      } else {
        module.exports = null;
      }
    }
  });

  // entry.jsx
  var import_react2 = __toESM(require_react());
  var import_client = __toESM(require_client());

  // LTB_Order_Tracker_CDN.jsx
  var import_react = __toESM(require_react());
  var Icon = ({ size = 24, children, ...props }) => import_react.default.createElement("svg", { width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round", ...props }, ...Array.isArray(children) ? children : [children]);
  var _p = (d) => import_react.default.createElement("path", { d });
  var _ci = (cx, cy, r) => import_react.default.createElement("circle", { cx, cy, r });
  var _rect = (x, y, w, h, rx) => import_react.default.createElement("rect", { x, y, width: w, height: h, rx });
  var _line = (x1, y1, x2, y2) => import_react.default.createElement("line", { x1, y1, x2, y2 });
  var _poly = (points) => import_react.default.createElement("polyline", { points });
  var Plus = ({ size = 24, ...r }) => import_react.default.createElement(Icon, { size, ...r }, _p("M12 5v14"), _p("M5 12h14"));
  var Trash2 = ({ size = 24, ...r }) => import_react.default.createElement(Icon, { size, ...r }, _p("M3 6h18"), _p("M19 6l-1 14H6L5 6"), _p("M8 6V4h8v2"), _p("M10 11v6"), _p("M14 11v6"));
  var Check = ({ size = 24, ...r }) => import_react.default.createElement(Icon, { size, ...r }, _poly("20 6 9 17 4 12"));
  var ChevronDown = ({ size = 24, ...r }) => import_react.default.createElement(Icon, { size, ...r }, _poly("6 9 12 15 18 9"));
  var ChevronUp = ({ size = 24, ...r }) => import_react.default.createElement(Icon, { size, ...r }, _poly("18 15 12 9 6 15"));
  var X = ({ size = 24, ...r }) => import_react.default.createElement(Icon, { size, ...r }, _p("M18 6 6 18"), _p("M6 6l12 12"));
  var Pencil = ({ size = 24, ...r }) => import_react.default.createElement(Icon, { size, ...r }, _p("M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"));
  var Copy = ({ size = 24, ...r }) => import_react.default.createElement(Icon, { size, ...r }, _rect(8, 8, 13, 13, 2), _p("M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"));
  var RotateCcw = ({ size = 24, ...r }) => import_react.default.createElement(Icon, { size, ...r }, _p("M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"), _p("M3 3v5h5"));
  var ClipboardPaste = ({ size = 24, ...r }) => import_react.default.createElement(Icon, { size, ...r }, _p("M9 3h6v3H9z"), _p("M8 3H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2h-2"), _p("M8 13h8"), _p("M8 17h8"), _p("M8 9h8"));
  var Archive = ({ size = 24, ...r }) => import_react.default.createElement(Icon, { size, ...r }, _rect(2, 3, 20, 5, 0), _p("M4 8v11a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8"), _p("M10 12h4"));
  var ImageIcon = ({ size = 24, ...r }) => import_react.default.createElement(Icon, { size, ...r }, _rect(3, 3, 18, 18, 2), _ci(8.5, 8.5, 1.5), _poly("21 15 16 10 5 21"));
  var AlertTriangle = ({ size = 24, ...r }) => import_react.default.createElement(Icon, { size, ...r }, _p("M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"), _line(12, 9, 12, 13), _line(12, 17, 12.01, 17));
  var FileText = ({ size = 24, ...r }) => import_react.default.createElement(Icon, { size, ...r }, _p("M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"), _poly("14 2 14 8 20 8"), _p("M16 13H8"), _p("M16 17H8"), _p("M10 9H8"));
  var Scale = ({ size = 24, ...r }) => import_react.default.createElement(Icon, { size, ...r }, _p("M16 16h6"), _p("M2 16h6"), _line(12, 2, 12, 22), _p("M8 16 2 8l6-8"), _p("M16 16l6-8-6-8"));
  var Camera = ({ size = 24, ...r }) => import_react.default.createElement(Icon, { size, ...r }, _p("M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"), _ci(12, 13, 4));
  var Download = ({ size = 24, ...r }) => import_react.default.createElement(Icon, { size, ...r }, _p("M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"), _poly("7 10 12 15 17 10"), _line(12, 15, 12, 3));
  var Upload = ({ size = 24, ...r }) => import_react.default.createElement(Icon, { size, ...r }, _p("M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"), _poly("17 8 12 3 7 8"), _line(12, 3, 12, 15));
  var ALL_DINNERS = [
    { name: "Indian Style Curry", variants: [
      { label: "Chicken, Small (~4-5)", price: 27, cost: 14.97 },
      { label: "Shrimp, Small (~4-5)", price: 36, cost: 23.97 },
      { label: "Chickpea, Small (~4-5)", price: 22, cost: 9.97 },
      { label: "Chicken, Large (~8-10)", price: 50, cost: 23.94 },
      { label: "Shrimp, Large (~8-10)", price: 70, cost: 32.94 },
      { label: "Chickpea, Large (~8-10)", price: 40, cost: 18.94 }
    ] },
    { name: "Shrimp or Tofu with Asparagus in Black Bean Sauce", variants: [
      { label: "Shrimp, Small Batch (~3-4)", price: 40, cost: 21.99 },
      { label: "Shrimp, Large Batch (~7-8)", price: 75, cost: 42.98 },
      { label: "Tofu, Small Batch (~3-4)", price: 25, cost: 10.6 },
      { label: "Tofu, Large Batch (~7-8)", price: 45, cost: 20.2 }
    ] },
    { name: "Texas Gulf Shrimp or Tofu and Chinese Broccoli", variants: [
      { label: "Shrimp, Small Batch (~4)", price: 40, cost: 19.56 },
      { label: "Shrimp, Large Batch (~8)", price: 75, cost: 38.12 },
      { label: "Tofu, Small Batch (~4)", price: 25, cost: 8.17 },
      { label: "Tofu, Large Batch (~8)", price: 45, cost: 15.34 }
    ] },
    { name: "Cumin Mushroom Noodles", variants: [
      { label: "Small (~3-4)", price: 40, cost: 18.35 },
      { label: "Large (~6-8)", price: 75, cost: 35.7 },
      { label: "Small (~3-4) + Asian Greens", price: 45, cost: 20.35 },
      { label: "Large (~6-8) + Asian Greens", price: 80, cost: 37.7 }
    ] },
    { name: "Thai Basil Chicken (Pad Krapow Gai)", variants: [
      { label: "Small (~3-4)", price: 30, cost: 13.35 },
      { label: "Large (~7-8)", price: 55, cost: 25.7 }
    ] },
    { name: "Pasta with Red Sauce", variants: [
      { label: "Base (~4)", price: 15, cost: 7.24 },
      { label: "With Beef or Turkey", price: 30, cost: 14.24 },
      { label: "With Mushrooms", price: 21, cost: 10.24 },
      { label: "With Both", price: 36, cost: 17.24 }
    ] },
    { name: "Bolognese", variants: [
      { label: "Small (split order, ~4)", price: 35, cost: 16.79 },
      { label: "Large (~8)", price: 60, cost: 32.57 }
    ] },
    { name: "Tex-Mex Kit", variants: [
      { label: "Pulled Pork, Small (~5-6)", price: 42, cost: 19.21 },
      { label: "Pulled Pork, Large (~9-10)", price: 80, cost: 37.42 },
      { label: "Pulled Beef, Small (~5-6)", price: 60, cost: 28.05 },
      { label: "Pulled Beef, Large (~9-10)", price: 115, cost: 55.1 }
    ] },
    { name: "Brunswick Stew", variants: [
      { label: "Small (~4)", price: 35, cost: 15.55 },
      { label: "Large (~8)", price: 65, cost: 31.1 }
    ] },
    { name: "Boeuf Bourguignon (Beef Stew)", variants: [
      { label: "~6 servings", price: 100, cost: 45.08 },
      { label: "With 1 lb mushrooms", price: 112, cost: 51.08 }
    ] },
    { name: "Chili", variants: [
      { label: "Small (split order, ~3-4)", price: 45, cost: 18.53 },
      { label: "Large (~6-8)", price: 80, cost: 37.06 }
    ] },
    { name: "Saffron Pork Ragu", variants: [
      { label: "~4 servings", price: 40, cost: 16.48 }
    ] },
    { name: "Mapo Eggplant", variants: [
      { label: "~5-6 servings", price: 35, cost: 13.63 }
    ] },
    { name: "Gumbo", variants: [
      { label: "Small (split order, ~3-4)", price: 40, cost: 15.31 },
      { label: "Large (~7-8)", price: 65, cost: 30.63 }
    ] },
    { name: "Stir Fried Long Beans with Ground Pork", variants: [
      { label: "Small (~4)", price: 30, cost: 11.58 },
      { label: "Large (~8)", price: 55, cost: 23.16 }
    ] }
  ];
  var DEFAULT_WEEK = ["Shrimp or Tofu with Asparagus in Black Bean Sauce", "Thai Basil Chicken (Pad Krapow Gai)", "Saffron Pork Ragu", "Mapo Eggplant", "Gumbo"];
  var ALWAYS_MENU = {
    breakfast: [
      { name: "Homemade Waffles", variants: [{ label: "Set of 12", price: 7, cost: 2.78 }] }
    ],
    fruit: [
      { name: "Fresh Cut Pineapple", variants: [{ label: "Per Container", price: 6, cost: 2.5 }] },
      { name: "Seasonal Cantaloupe", variants: [{ label: "Per Container", price: 6, cost: 3 }] }
    ],
    desserts: [
      { name: "Chocolate Chip Cookies", variants: [
        { label: "1 Dozen (Standard)", price: 25, cost: 11.33 },
        { label: "1 Dozen (Premium Valrhona)", price: 40, cost: 23.33 }
      ] },
      { name: "Peanut Butter Fudge", variants: [{ label: "1 Batch", price: 15, cost: 4.35 }] }
    ],
    addons: [
      { name: "Queso", variants: [
        { label: "Per Pint Jar", price: 12, cost: 4.87 },
        { label: "With jar swap", price: 10, cost: 3.62 }
      ] },
      { name: "Pickled Onions or Carrots", variants: [
        { label: "Standard", price: 7.5, cost: 4 },
        { label: "With jar swap", price: 5.5, cost: 2.75 }
      ] },
      { name: "Chili Oil", variants: [
        { label: "Per Jar", price: 10, cost: 4.07 },
        { label: "With jar swap", price: 8, cost: 3.07 }
      ] },
      { name: "Thyme or Lavender Syrup", variants: [
        { label: "Per Jar", price: 7, cost: 3.67 },
        { label: "With jar swap", price: 5, cost: 1.67 }
      ] },
      { name: "Vanilla Syrup", variants: [
        { label: "Per Jar", price: 12, cost: 7.17 },
        { label: "With jar swap", price: 10, cost: 5.17 }
      ] },
      { name: "Vanilla Lavender Syrup", variants: [
        { label: "Per Jar", price: 13, cost: 8.17 },
        { label: "With jar swap", price: 11, cost: 6.17 }
      ] }
    ],
    bag: [
      { name: "Ribeye", perLb: true, pricePerLb: 25, costPerLb: 19, variants: [{ label: "price by weight", price: 26.5, cost: 19 }] },
      { name: "NY Strip", perLb: true, pricePerLb: 23, costPerLb: 17.49, variants: [{ label: "price by weight", price: 24.5, cost: 17.49 }] },
      { name: "Filet Mignon", perLb: true, pricePerLb: 34, costPerLb: 24.99, variants: [{ label: "price by weight", price: 35.5, cost: 24.99 }] },
      { name: "Chicken Breast", perLb: true, pricePerLb: 9, costPerLb: 6, variants: [{ label: "price by weight", price: 10.5, cost: 6 }] },
      { name: "Pork Tenderloin", perLb: true, pricePerLb: 15, costPerLb: 8, variants: [{ label: "price by weight", price: 20.25, cost: 10 }] },
      { name: "Whipped Lemon Garlic Herb Butter", variants: [{ label: "Per Container", price: 2, cost: 1 }] },
      { name: "Baby Gold Potatoes", variants: [{ label: "2 servings", price: 7, cost: 2.5 }] },
      { name: "Carrots", variants: [{ label: "2 servings", price: 6, cost: 1.83 }] }
    ]
  };
  var PER_LB_ITEMS = {};
  ALWAYS_MENU.bag.forEach((it) => {
    if (it.perLb) PER_LB_ITEMS[it.name] = { pricePerLb: it.pricePerLb, costPerLb: it.costPerLb };
  });
  function isPerLbItem(name) {
    return !!PER_LB_ITEMS[name];
  }
  var FULL_MENU = { dinner: ALL_DINNERS, ...ALWAYS_MENU };
  function buildMenu(selectedDinners) {
    return { dinner: ALL_DINNERS.filter((d) => selectedDinners.includes(d.name)), ...ALWAYS_MENU };
  }
  var CATEGORY_LABELS = {
    dinner: "Dinner",
    breakfast: "Breakfast",
    fruit: "Fresh Cut Fruit",
    desserts: "Desserts",
    addons: "Add-Ons & Extras",
    bag: "Stuff in a Bag"
  };
  var STATUSES = ["Ordered", "Cooking", "Ready", "Delivered"];
  var STATUS_COLORS = {
    Ordered: "#7F77DD",
    Cooking: "#EF9F27",
    Ready: "#1D9E75",
    Delivered: "#5F5E5A"
  };
  var SURCHARGE = 2;
  var ORDERS_KEY = "ltb-orders";
  var CHECKS_KEY = "ltb-cook-checks";
  var SHOPPING_KEY = "ltb-shopping";
  var WEEK_KEY = "ltb-week";
  var PENDING_KEY = "ltb-pending-orders";
  var SEEN_ROWS_KEY = "ltb-seen-rows";
  var REGULARS_KEY = "ltb-regulars";
  var INVENTORY_KEY = "ltb-inventory";
  var FORM_CSV_URL = "https://ltb-proxy.strickland-kevinj.workers.dev/sheet";
  var I = (name, q, u, staple = false) => ({ name, q, u, staple });
  var RECIPES = {
    "Indian Style Curry": {
      factors: {
        "Chickpea, Small (~4-5)": 0.5,
        "Chicken, Small (~4-5)": 0.5,
        "Shrimp, Small (~4-5)": 0.5,
        "Chickpea, Large (~8-10)": 1,
        "Chicken, Large (~8-10)": 1,
        "Shrimp, Large (~8-10)": 1
      },
      base: [
        I("Canned tomatoes", 1, "28oz can"),
        I("Red onion", 28, "oz"),
        I("Butter", 2, "sticks"),
        I("Kitchen Basics chicken stock", 32, "oz"),
        I("Limes", 2, ""),
        I("Weekly vegetables + chickpeas", 1, "lb"),
        I("Mix of spicy peppers", 1, "handful"),
        I("Curry powder", 0.25, "cup", true),
        I("Brown sugar", 2, "tbsp", true),
        I("Rice (included with order)", 1, "batch", true)
      ],
      extras: {
        "Chicken, Small (~4-5)": [I("Chicken thighs", 1, "lb")],
        "Chicken, Large (~8-10)": [I("Chicken thighs", 1, "lb")],
        "Shrimp, Small (~4-5)": [I("Shrimp", 1, "lb")],
        "Shrimp, Large (~8-10)": [I("Shrimp", 1, "lb")]
      }
    },
    "Texas Gulf Shrimp or Tofu and Chinese Broccoli": {
      factors: {
        "Shrimp, Small Batch (~4)": 1,
        "Shrimp, Large Batch (~8)": 2,
        "Tofu, Small Batch (~4)": 1,
        "Tofu, Large Batch (~8)": 2
      },
      base: [
        I("Chinese broccoli", 8, "oz"),
        I("Garlic", 3, "cloves"),
        I("Ginger", 1, "knob"),
        I("Oyster sauce", 3, "tbsp", true),
        I("Soy sauce", 2, "tbsp", true),
        I("Dark soy sauce", 1, "tbsp", true),
        I("House chili oil", 2, "tbsp", true),
        I("Rice (included with order)", 1, "batch", true)
      ],
      extras: {
        "Shrimp, Small Batch (~4)": [I("Shrimp", 1, "lb")],
        "Shrimp, Large Batch (~8)": [I("Shrimp", 1, "lb")],
        "Tofu, Small Batch (~4)": [I("Tofu", 1, "block")],
        "Tofu, Large Batch (~8)": [I("Tofu", 1, "block")]
      }
    },
    "Cumin Mushroom Noodles": {
      factors: {
        "Small (~3-4)": 0.5,
        "Large (~6-8)": 1,
        "Small (~3-4) + Asian Greens": 0.5,
        "Large (~6-8) + Asian Greens": 1
      },
      base: [
        I("Mushrooms", 3, "lb"),
        I("Garlic", 16, "cloves"),
        I("Ginger", 4, "knobs"),
        I("Red onion (large)", 2, ""),
        I("Cilantro", 1, "bunch"),
        I("Fresh noodles (not dried)", 1, "batch"),
        I("Cumin + spices", 1, "blend", true),
        I("Chinkiang vinegar", 6, "tbsp", true),
        I("Shaoxing wine", 0.5, "cup", true),
        I("House chili oil", 1, "cup", true)
      ],
      extras: {
        "Small (~3-4) + Asian Greens": [{ ...I("Asian greens", 1, "lb"), fixed: true }],
        "Large (~6-8) + Asian Greens": [{ ...I("Asian greens", 1, "lb"), fixed: true }]
      }
    },
    "Bolognese": {
      factors: { "Small (split order, ~4)": 0.5, "Large (~8)": 1 },
      base: [
        I("Ground pork", 1, "lb"),
        I("Ground lamb", 1, "lb"),
        I("Ground beef", 1, "lb"),
        I("Whole milk", 1, "cup"),
        I("Red wine", 1, "bottle"),
        I("Tomato paste", 1, "small can"),
        I("Fresh thyme", 1, "bunch"),
        I("Onion", 1, ""),
        I("Carrot", 1, ""),
        I("Garlic", 4, "cloves"),
        I("Pasta (ask customer for shape!)", 2, "lb"),
        I("Nutmeg", 1, "pinch", true)
      ]
    },
    "Shrimp or Tofu with Asparagus in Black Bean Sauce": {
      factors: {
        "Shrimp, Small Batch (~3-4)": 1,
        "Shrimp, Large Batch (~7-8)": 2,
        "Tofu, Small Batch (~3-4)": 1,
        "Tofu, Large Batch (~7-8)": 2
      },
      base: [
        I("Asparagus", 1, "lb"),
        I("Scallions", 1, "bunch"),
        I("Garlic", 3, "cloves"),
        I("Ginger", 1, "knob"),
        I("Soy + Shaoxing + black beans + sugar", 1, "batch", true),
        I("Rice (included with order)", 1, "batch", true)
      ],
      extras: {
        "Shrimp, Small Batch (~3-4)": [I("Shrimp", 1, "lb")],
        "Shrimp, Large Batch (~7-8)": [I("Shrimp", 1, "lb")],
        "Tofu, Small Batch (~3-4)": [I("Tofu", 1, "block")],
        "Tofu, Large Batch (~7-8)": [I("Tofu", 1, "block")]
      }
    },
    "Thai Basil Chicken (Pad Krapow Gai)": {
      factors: { "Small (~3-4)": 1, "Large (~7-8)": 2 },
      base: [
        I("Ground chicken", 1, "lb"),
        I("Asparagus", 8, "oz"),
        I("Thai basil", 1, "bunch"),
        I("Garlic", 6, "cloves"),
        I("Limes", 1, ""),
        I("Oyster + soy + fish sauce + sugar", 1, "batch", true),
        I("Rice (included with order)", 1, "batch", true)
      ]
    },
    "Pasta with Red Sauce": {
      factors: { "Base (~4)": 1, "With Beef or Turkey": 1, "With Mushrooms": 1, "With Both": 1 },
      base: [
        I("Canned tomatoes", 1, "28oz can"),
        I("Garlic", 5, "cloves"),
        I("Pasta", 1, "lb"),
        I("Good olive oil", 1, "glug", true)
      ],
      extras: {
        "With Beef or Turkey": [I("Ground beef or turkey", 1, "lb")],
        "With Mushrooms": [I("Baby bella mushrooms", 8, "oz")],
        "With Both": [I("Ground beef or turkey", 1, "lb"), I("Baby bella mushrooms", 8, "oz")]
      }
    },
    "Tex-Mex Kit": {
      factors: {
        "Pulled Pork, Small (~5-6)": 1,
        "Pulled Pork, Large (~9-10)": 2,
        "Pulled Beef, Small (~5-6)": 1,
        "Pulled Beef, Large (~9-10)": 2
      },
      base: [
        I("Beans (for refried)", 1, "lb"),
        I("Tomatoes (pico)", 1, "lb"),
        I("Red onion", 1.5, "lb"),
        I("Cilantro", 1, "bunch"),
        I("Limes", 8, ""),
        I("Garlic", 4, "cloves"),
        I("HEB bakery tortillas", 1, "10-ct pack"),
        I("Dried peppers (red sauce)", 8, "oz"),
        I("Orange juice", 1, "small bottle"),
        I("Tex-Mex spices", 1, "blend", true)
      ],
      extras: {
        "Pulled Pork, Small (~5-6)": [I("Bone-in pork butt", 4, "lb")],
        "Pulled Pork, Large (~9-10)": [I("Bone-in pork butt", 4, "lb")],
        "Pulled Beef, Small (~5-6)": [I("Beef chuck roast", 2.5, "lb")],
        "Pulled Beef, Large (~9-10)": [I("Beef chuck roast", 2.5, "lb")]
      }
    },
    "Brunswick Stew": {
      factors: { "Small (~4)": 1, "Large (~8)": 2 },
      base: [
        I("Chicken thighs", 1, "lb"),
        I("Salt pork", 2, "oz"),
        I("Chicken stock", 4, "cups"),
        I("Canned peeled tomatoes", 1, "14oz can"),
        I("Red potatoes", 0.5, "lb"),
        I("Onion", 1, "lb"),
        I("Corn", 3, "ears"),
        I("Dried lima beans", 5, "oz"),
        I("Worcestershire + vinegar + flour", 1, "batch", true)
      ]
    },
    "Boeuf Bourguignon (Beef Stew)": {
      factors: { "~6 servings": 1, "With 1 lb mushrooms": 1 },
      base: [
        I("Beef chuck roast", 2.5, "lb"),
        I("Red potatoes", 1.5, "lb"),
        I("Carrots", 1.5, "lb"),
        I("Red wine", 1, "bottle"),
        I("Beef stock", 8, "cups"),
        I("Fresh thyme", 1, "bunch"),
        I("Tomato paste", 1, "small can"),
        I("Onion", 1, "lb"),
        I("Bay + salt + pepper + vinegar", 1, "batch", true)
      ],
      extras: {
        "With 1 lb mushrooms": [I("Mushrooms", 1, "lb")]
      }
    },
    "Chili": {
      factors: { "Small (split order, ~3-4)": 0.5, "Large (~6-8)": 1 },
      base: [
        I("Ground beef", 2, "lb"),
        I("Dried kidney beans", 1, "lb"),
        I("Assorted dried chilis", 1, "bag"),
        I("Chicken broth", 4, "cups"),
        I("Canned tomatoes", 1, "28oz can"),
        I("Dark chocolate", 1, "oz"),
        I("Anchovies", 1, "tin"),
        I("Tomato paste", 1, "small can"),
        I("Limes", 1, ""),
        I("Espresso + bourbon + marmite + soy + spices", 1, "batch", true)
      ]
    },
    "Homemade Waffles": {
      factors: { "Set of 12": 1 },
      base: [
        I("Milk", 2, "cups"),
        I("Butter", 1, "stick"),
        I("Flour", 270, "g", true),
        I("Eggs", 2, "", true),
        I("Gallon ziplock bag", 1, "", true)
      ]
    },
    "Fresh Cut Pineapple": {
      factors: { "Per Container": 0.5 },
      base: [I("Pineapple (1 makes 2 containers)", 1, "")]
    },
    "Seasonal Cantaloupe": {
      factors: { "Per Container": 1 },
      base: [I("Seasonal cantaloupe (HEB melons)", 1, "")]
    },
    "Chocolate Chip Cookies": {
      factors: { "1 Dozen (Standard)": 1, "1 Dozen (Premium Valrhona)": 1 },
      base: [
        I("Butter", 2, "sticks"),
        I("Flour", 322, "g", true),
        I("Eggs", 3, "", true),
        I("Brown + white sugar", 1, "batch", true)
      ],
      extras: {
        "1 Dozen (Standard)": [I("Guittard chocolate (low + high %)", 290, "g")],
        "1 Dozen (Premium Valrhona)": [I("Valrhona chocolate", 290, "g")]
      }
    },
    "Peanut Butter Fudge": {
      factors: { "1 Batch": 1 },
      base: [
        I("Peanut butter", 0.5, "cup"),
        I("Evaporated milk", 0.75, "cup"),
        I("Butter", 3, "tbsp"),
        I("Sugar + karo + cocoa + vanilla", 1, "batch", true)
      ]
    },
    "Queso": {
      factors: { "Per Pint Jar": 0.5, "With jar swap": 0.5 },
      base: [
        I("Oaxaca cheese", 250, "g"),
        I("Colby Jack", 250, "g"),
        I("Poblano pepper", 90, "g"),
        I("Sweet onion", 135, "g"),
        I("Habaneros", 2, ""),
        I("Dried ancho chili", 9, "g"),
        I("Limes", 1, ""),
        I("Cilantro", 15, "g"),
        I("Sodium citrate", 20, "g", true),
        I("Pint mason jar", 2, "", false)
      ]
    },
    "Pickled Onions or Carrots": {
      factors: { "Standard": 1, "With jar swap": 1 },
      base: [
        I("Onions or carrots (for pickling)", 1, "lb"),
        I("Pint mason jar", 1, ""),
        I("Pickling vinegar + spices", 1, "batch", true)
      ]
    },
    "Chili Oil": {
      factors: { "Per Jar": 0.5, "With jar swap": 0.5 },
      base: [
        I("Ginger", 4, "knobs"),
        I("Pint mason jar", 2, ""),
        I("Chili flakes + whole spices + oil", 1, "batch", true)
      ]
    },
    "Thyme or Lavender Syrup": {
      factors: { "Per Jar": 1, "With jar swap": 1 },
      base: [
        I("Fresh thyme or lavender", 1, "bunch"),
        I("Pint mason jar", 1, ""),
        I("Sugar", 1, "cup", true)
      ]
    },
    "Vanilla Syrup": {
      factors: { "Per Jar": 1, "With jar swap": 1 },
      base: [
        I("Pint mason jar", 1, ""),
        I("House vanilla extract + beans", 1, "batch", true),
        I("Sugar", 1, "cup", true)
      ]
    },
    "Vanilla Lavender Syrup": {
      factors: { "Per Jar": 1, "With jar swap": 1 },
      base: [
        I("Fresh lavender", 1, "bunch"),
        I("Pint mason jar", 1, ""),
        I("House vanilla extract + beans", 1, "batch", true),
        I("Sugar", 1, "cup", true)
      ]
    },
    "Ribeye": {
      factors: { "price by weight": 1 },
      base: [I("Ribeye", 1, "lb"), I("Sous vide bag + seasonings", 1, "", true)]
    },
    "NY Strip": {
      factors: { "price by weight": 1 },
      base: [I("NY Strip", 1, "lb"), I("Sous vide bag + seasonings", 1, "", true)]
    },
    "Filet Mignon": {
      factors: { "price by weight": 1 },
      base: [I("Filet Mignon", 1, "lb"), I("Sous vide bag + seasonings", 1, "", true)]
    },
    "Chicken Breast": {
      factors: { "price by weight": 1 },
      base: [I("Chicken breast", 1, "lb"), I("Sous vide bag + seasonings", 1, "", true)]
    },
    "Baby Gold Potatoes": {
      factors: { "2 servings": 1 },
      base: [I("Baby gold potatoes", 0.6, "lb"), I("Sous vide bag + seasonings", 1, "", true)]
    },
    "Carrots": {
      factors: { "2 servings": 1 },
      base: [I("Carrots", 0.6, "lb"), I("Sous vide bag + seasonings", 1, "", true)]
    },
    "Pork Tenderloin": {
      factors: { "price by weight": 1 },
      base: [I("Pork tenderloin", 1.25, "lb"), I("Sous vide bag + seasonings", 1, "", true)]
    },
    "Saffron Pork Ragu": {
      factors: { "~4 servings": 1 },
      base: [
        I("Ground pork", 1, "lb"),
        I("Fennel bulb", 1, ""),
        I("Onion", 1, ""),
        I("Garlic", 4, "cloves"),
        I("Crushed tomatoes", 1, "can"),
        I("Dry sherry", 0.5, "cup"),
        I("Saffron", 1, "pinch", true),
        I("Pasta (ask customer for shape!)", 1, "lb")
      ]
    },
    "Mapo Eggplant": {
      factors: { "~5-6 servings": 1 },
      base: [
        I("Chinese eggplant", 2, "lb"),
        I("Ground chicken", 0.5, "lb"),
        I("Doubanjiang", 3, "tbsp"),
        I("Garlic", 4, "cloves"),
        I("Ginger", 1, "knob"),
        I("Scallions", 1, "bunch"),
        I("House chili oil", 0.25, "cup", true),
        I("Sichuan peppercorns", 1, "tbsp", true),
        I("Rice (included with order)", 1, "batch", true)
      ]
    },
    "Gumbo": {
      factors: { "Small (split order, ~3-4)": 0.5, "Large (~7-8)": 1 },
      base: [
        I("Chicken thighs", 2, "lb"),
        I("Boudin", 1, "lb"),
        I("Onion", 1, ""),
        I("Green bell pepper", 1, ""),
        I("Celery", 3, "stalks"),
        I("Garlic", 4, "cloves"),
        I("Flour", 1, "cup"),
        I("Okra", 0.5, "lb"),
        I("Cajun spices", 1, "blend", true),
        I("Rice (included with order)", 1, "batch", true)
      ]
    },
    "Stir Fried Long Beans with Ground Pork": {
      factors: { "Small (~4)": 0.5, "Large (~8)": 1 },
      base: [
        I("Long beans", 1.5, "lb"),
        I("Ground pork", 1, "lb"),
        I("Doubanjiang", 2, "tbsp"),
        I("Garlic", 6, "cloves"),
        I("Scallions", 1, "bunch"),
        I("Soy sauce", 2, "tbsp", true),
        I("Rice (included with order)", 1, "batch", true)
      ]
    }
  };
  var INGREDIENT_SYNONYMS = {
    "scallion": "green onion",
    "scallions": "green onion",
    "spring onion": "green onion",
    "coriander": "cilantro",
    "chili": "chile",
    "chilli": "chile"
  };
  function normalizeIngredientName(name) {
    let n = String(name).toLowerCase().trim();
    n = n.replace(/\s*\(.*?\)\s*/g, " ").trim();
    n = n.replace(/\s+/g, " ");
    n = n.split(" ").map((w) => {
      if (INGREDIENT_SYNONYMS[w]) return INGREDIENT_SYNONYMS[w];
      if (w.length > 4 && w.endsWith("s") && !w.endsWith("ss")) return w.slice(0, -1);
      return w;
    }).join(" ");
    return INGREDIENT_SYNONYMS[n] || n;
  }
  function generateShoppingItems(activeOrders, includeStaples) {
    const agg = /* @__PURE__ */ new Map();
    const unknown = [];
    const addIng = (name, qty, unit, staple, factor) => {
      const norm = normalizeIngredientName(name);
      const normUnit = unit.length > 3 && unit.endsWith("s") && !unit.endsWith("ss") ? unit.slice(0, -1) : unit;
      const key = `${norm}|${normUnit}`;
      if (!agg.has(key)) agg.set(key, { display: name, u: unit, q: 0, staple });
      agg.get(key).q += qty * factor;
    };
    activeOrders.forEach((o) => {
      (o.items || []).forEach((it) => {
        if (isPerLbItem(it.name)) {
          const lbs = (typeof it.weight === "number" && it.weight > 0 ? it.weight : 1) * it.qty;
          addIng(it.name, lbs, "lb", false, 1);
          if (includeStaples) addIng("Sous vide bag + seasonings", 1, "", true, it.qty);
          return;
        }
        const recipe = RECIPES[it.name];
        if (!recipe) {
          unknown.push(`${it.qty}x ${it.name} (${it.variant}) \u2014 no recipe data, plan manually`);
          return;
        }
        const factor = (recipe.factors?.[it.variant] ?? 1) * it.qty;
        const ings = [...recipe.base || [], ...(recipe.extras || {})[it.variant] || []];
        ings.forEach((ing) => {
          if (ing.staple && !includeStaples) return;
          addIng(ing.name, ing.q, ing.u, ing.staple, ing.fixed ? it.qty : factor);
        });
      });
    });
    const fmtQ = (q) => String(Math.round(q * 100) / 100);
    const lines = Array.from(agg.values()).sort((a, b) => a.staple === b.staple ? a.display.localeCompare(b.display) : a.staple ? 1 : -1).map((x) => {
      const qty = x.u ? `${fmtQ(x.q)} ${x.u}` : fmtQ(x.q);
      return `${x.display} \u2014 ${qty}${x.staple ? " (staple)" : ""}`;
    });
    return [...lines, ...unknown];
  }
  var uid = () => Math.random().toString(36).slice(2, 10);
  var currency = (n) => `$${(Number(n) || 0).toFixed(2)}`;
  var round2 = (n) => Math.round(n * 100) / 100;
  var DISH_CUISINE = {
    "Indian Style Curry": "Indian",
    "Shrimp or Tofu with Asparagus in Black Bean Sauce": "Chinese",
    "Texas Gulf Shrimp or Tofu and Chinese Broccoli": "Chinese",
    "Cumin Mushroom Noodles": "Chinese",
    "Thai Basil Chicken (Pad Krapow Gai)": "Thai",
    "Stir Fried Long Beans with Ground Pork": "Chinese",
    "Mapo Eggplant": "Chinese",
    "Pasta with Red Sauce": "Italian",
    "Bolognese": "Italian",
    "Saffron Pork Ragu": "Italian",
    "Tex-Mex Kit": "Tex-Mex",
    "Brunswick Stew": "Southern",
    "Gumbo": "Southern",
    "Boeuf Bourguignon (Beef Stew)": "French",
    "Chili": "American"
  };
  var dishCuisine = (name) => DISH_CUISINE[name] || "Other";
  var normName = (s) => String(s || "").toLowerCase().trim().replace(/\s+/g, " ");
  function nameMatchType(a, b) {
    const na = normName(a), nb = normName(b);
    if (!na || !nb) return null;
    if (na === nb) return "exact";
    const fa = na.split(" ")[0], fb = nb.split(" ")[0];
    if (fa && fa === fb) return "partial";
    if (na.includes(nb) || nb.includes(na)) return "partial";
    return null;
  }
  var MIN_ORDERS_FOR_INSIGHT = 5;
  function buildInsights(linkedOrders) {
    const orders = (linkedOrders || []).filter((o) => o && Array.isArray(o.items));
    if (orders.length < MIN_ORDERS_FOR_INSIGHT) return [];
    const insights = [];
    const cuisineCount = {};
    const dishCount = {};
    let totalDishLines = 0;
    orders.forEach((o) => {
      o.items.forEach((it) => {
        if (!ALL_DINNERS.some((d) => d.name === it.name)) return;
        const c = dishCuisine(it.name);
        cuisineCount[c] = (cuisineCount[c] || 0) + 1;
        dishCount[it.name] = (dishCount[it.name] || 0) + 1;
        totalDishLines += 1;
      });
    });
    if (totalDishLines >= 4) {
      const sorted = Object.entries(cuisineCount).sort((a, b) => b[1] - a[1]);
      if (sorted.length && sorted[0][1] >= 3 && sorted[0][1] / totalDishLines >= 0.5 && sorted[0][0] !== "Other") {
        insights.push(`Tends to favor ${sorted[0][0]} dishes (${sorted[0][1]} of ${totalDishLines} dinner orders).`);
      }
    }
    const favDish = Object.entries(dishCount).sort((a, b) => b[1] - a[1])[0];
    if (favDish && favDish[1] >= 3) {
      insights.push(`Repeat favorite: ${favDish[0]} (ordered ${favDish[1]} times).`);
    }
    const spiceNotes = [];
    orders.forEach((o) => {
      const blob = ((o.notes || "") + " " + (o.items || []).map((it) => it.note || "").join(" ")).toLowerCase();
      const m = blob.match(/spice\s*(?:level\s*)?(\d)/);
      if (m) spiceNotes.push(parseInt(m[1], 10));
    });
    if (spiceNotes.length >= 3) {
      const avg = spiceNotes.reduce((a, b) => a + b, 0) / spiceNotes.length;
      if (Math.max(...spiceNotes) - Math.min(...spiceNotes) <= 1) {
        insights.push(`Consistent spice preference around level ${Math.round(avg)}.`);
      }
    }
    const addonCount = {};
    orders.forEach((o) => {
      o.items.forEach((it) => {
        if (ALL_DINNERS.some((d) => d.name === it.name)) return;
        addonCount[it.name] = (addonCount[it.name] || 0) + 1;
      });
    });
    const favAddon = Object.entries(addonCount).sort((a, b) => b[1] - a[1])[0];
    if (favAddon && favAddon[1] >= 3) {
      insights.push(`Regularly adds ${favAddon[0]} (${favAddon[1]} orders).`);
    }
    return insights;
  }
  function insightStamp(text) {
    const d = /* @__PURE__ */ new Date();
    const mo = d.toLocaleDateString(void 0, { month: "short" });
    return `[Auto-insight \xB7 ${mo} ${d.getDate()}] ${text}`;
  }
  function discountAmount(itemsTotal, discountType, discountValue) {
    if (!discountType || !discountValue) return 0;
    if (discountType === "percent") return round2(itemsTotal * (discountValue / 100));
    return round2(Math.min(discountValue, itemsTotal));
  }
  function itemsUpchargeTotal(items) {
    return round2((items || []).reduce((sum, it) => {
      const amt = it.upcharge && typeof it.upcharge.amount === "number" ? it.upcharge.amount : 0;
      return sum + amt * it.qty;
    }, 0));
  }
  function customChargesTotal(customCharges) {
    return round2((customCharges || []).reduce((sum, ch) => sum + (Number(ch.amount) || 0), 0));
  }
  function itemsBaseTotal(items) {
    return round2((items || []).reduce((sum, it) => sum + (Number(it.price) || 0) * (Number(it.qty) || 1), 0));
  }
  function orderTotal(items, jarSwaps, containerReturns, discountType, discountValue, customCharges, waiveSurcharge) {
    const base = itemsBaseTotal(items);
    const upcharges = itemsUpchargeTotal(items);
    const custom = customChargesTotal(customCharges);
    const disc = discountAmount(base, discountType, discountValue);
    const surcharge = waiveSurcharge ? 0 : SURCHARGE;
    return round2(base + upcharges - disc + custom + surcharge - (jarSwaps || 0) * 2 - (containerReturns || 0) * 1);
  }
  function repricePerLbItem(it) {
    const info = PER_LB_ITEMS[it.name];
    if (!info) return it;
    const lbs = typeof it.weight === "number" && it.weight > 0 ? it.weight : 1;
    const BAG = 1.5;
    return {
      ...it,
      weightPending: false,
      price: round2(info.pricePerLb * lbs + BAG),
      cost: round2(info.costPerLb * lbs)
    };
  }
  function itemCost(it) {
    if (typeof it.cost === "number") return it.cost;
    const menuItem = (FULL_MENU[it.category] || []).find((m) => m.name === it.name);
    const variant = menuItem?.variants.find((v) => v.label === it.variant);
    return typeof variant?.cost === "number" ? variant.cost : null;
  }
  function orderCostInfo(order) {
    let cost = 0;
    let complete = true;
    (order.items || []).forEach((it) => {
      const c = itemCost(it);
      if (c === null) complete = false;
      else cost += c * it.qty;
    });
    return { cost: round2(cost), complete };
  }
  function groupKeyFor(order, mode) {
    const d = new Date(order.createdAt || 0);
    if (mode === "week") {
      const day = (d.getDay() + 6) % 7;
      const mon = new Date(d);
      mon.setDate(d.getDate() - day);
      return {
        label: `Week of ${mon.toLocaleDateString(void 0, { month: "short", day: "numeric" })}`,
        stamp: new Date(mon.getFullYear(), mon.getMonth(), mon.getDate()).getTime()
      };
    }
    if (mode === "month") {
      return {
        label: d.toLocaleDateString(void 0, { month: "long", year: "numeric" }),
        stamp: new Date(d.getFullYear(), d.getMonth(), 1).getTime()
      };
    }
    if (mode === "year") {
      return { label: String(d.getFullYear()), stamp: new Date(d.getFullYear(), 0, 1).getTime() };
    }
    return { label: "", stamp: 0 };
  }
  function formatDate(iso) {
    if (!iso) return "";
    try {
      return new Date(iso).toLocaleDateString(void 0, { month: "short", day: "numeric" });
    } catch {
      return "";
    }
  }
  function orderToText(order) {
    const lines = [`LTB Order \u2014 ${order.customer}`];
    (order.items || []).forEach((it) => {
      const up = it.upcharge && it.upcharge.amount ? it.price + it.upcharge.amount : it.price;
      lines.push(`${it.qty}x ${it.name} (${it.variant}) \u2014 ${currency(up * it.qty)}`);
      if (it.upcharge && it.upcharge.amount)
        lines.push(`   + ${it.upcharge.label || "Upcharge"} (+${currency(it.upcharge.amount)} ea)`);
      if (it.note) lines.push(`   note: ${it.note}`);
    });
    const base = itemsBaseTotal(order.items);
    const disc = discountAmount(base, order.discountType, order.discountValue);
    if (disc > 0) {
      const label = order.discountType === "percent" ? `${order.discountValue}% discount` : "Discount";
      lines.push(`${label} \u2014 -${currency(disc)}`);
    }
    (order.customCharges || []).forEach((ch) => {
      lines.push(`${ch.label || "Charge"} \u2014 ${currency(Number(ch.amount) || 0)}`);
    });
    if (!order.waiveSurcharge) lines.push(`Order surcharge \u2014 ${currency(SURCHARGE)}`);
    if (order.jarSwaps > 0)
      lines.push(`Jar swap x${order.jarSwaps} \u2014 -${currency(order.jarSwaps * 2)}`);
    if (order.containerReturns > 0)
      lines.push(`Container return x${order.containerReturns} \u2014 -${currency(order.containerReturns)}`);
    lines.push(`Total: ${currency(order.total)}`);
    if (order.notes) lines.push(`Notes: ${order.notes}`);
    return lines.join("\n");
  }
  async function copyText(text) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      try {
        const ta = document.createElement("textarea");
        ta.value = text;
        ta.style.position = "fixed";
        ta.style.opacity = "0";
        document.body.appendChild(ta);
        ta.select();
        const ok = document.execCommand("copy");
        document.body.removeChild(ta);
        return ok;
      } catch {
        return false;
      }
    }
  }
  var localStore = {
    async get(key) {
      const value = window.localStorage.getItem(key);
      return value === null ? null : { key, value };
    },
    async set(key, value) {
      window.localStorage.setItem(key, value);
      return { key, value };
    },
    async delete(key) {
      window.localStorage.removeItem(key);
      return { key, deleted: true };
    },
    async list(prefix) {
      const keys = [];
      for (let i = 0; i < window.localStorage.length; i++) {
        const k = window.localStorage.key(i);
        if (k && (!prefix || k.startsWith(prefix))) keys.push(k);
      }
      return { keys };
    }
  };
  var store = typeof window !== "undefined" && window.storage ? window.storage : localStore;
  async function loadJSON(key, fallback) {
    try {
      const result = await store.get(key);
      return result ? JSON.parse(result.value) : fallback;
    } catch {
      return fallback;
    }
  }
  async function saveJSON(key, value) {
    let serialized;
    try {
      serialized = JSON.stringify(value);
    } catch (e) {
      return { ok: false, error: "Could not serialize data", bytes: 0 };
    }
    const bytes = serialized.length;
    let lastErr = null;
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const result = await store.set(key, serialized);
        if (result) return { ok: true, error: null, bytes };
        lastErr = "Storage returned empty";
      } catch (e) {
        lastErr = e && e.message || "Storage threw an error";
      }
      if (attempt === 0) await new Promise((r) => setTimeout(r, 150));
    }
    return { ok: false, error: lastErr, bytes };
  }
  function saveError(res) {
    if (res && res.ok) return null;
    const bytes = res ? res.bytes : 0;
    if (bytes > 4.8 * 1024 * 1024) {
      return `Storage full: this data is ${(bytes / 1024 / 1024).toFixed(1)}MB, over the ~5MB limit. Archive or delete old orders, then it will save.`;
    }
    const detail = res && res.error ? ` (${res.error})` : "";
    return `Could not save${detail}. Your changes are shown but not yet stored \u2014 try again.`;
  }
  var PHOTO_PREFIX = "ltb-photo-";
  var PHOTO_TTL_DAYS = 30;
  function photoKey(orderId, itemIdx) {
    return `${PHOTO_PREFIX}${orderId}-${itemIdx}`;
  }
  async function savePhoto(orderId, itemIdx, base64) {
    try {
      const r = await store.set(photoKey(orderId, itemIdx), JSON.stringify({ d: base64, t: Date.now() }));
      return !!r;
    } catch {
      return false;
    }
  }
  async function loadPhoto(orderId, itemIdx) {
    try {
      const r = await store.get(photoKey(orderId, itemIdx));
      if (!r) return null;
      const parsed = JSON.parse(r.value);
      return parsed.d || null;
    } catch {
      return null;
    }
  }
  async function deletePhoto(orderId, itemIdx) {
    try {
      await store.delete(photoKey(orderId, itemIdx));
    } catch {
    }
  }
  async function photoStorageBytes() {
    try {
      const res = await store.list(PHOTO_PREFIX);
      const keys = res && res.keys || [];
      let bytes = 0;
      for (const k of keys) {
        try {
          const r = await store.get(k);
          if (r && r.value) bytes += r.value.length;
        } catch {
        }
      }
      return { bytes, count: keys.length };
    } catch {
      return { bytes: 0, count: 0 };
    }
  }
  async function cleanupPhotos(orders) {
    try {
      const res = await store.list(PHOTO_PREFIX);
      const keys = res && res.keys || [];
      if (keys.length === 0) return;
      const byId = new Map((orders || []).map((o) => [o.id, o]));
      const cutoff = Date.now() - PHOTO_TTL_DAYS * 24 * 60 * 60 * 1e3;
      for (const k of keys) {
        const rest = k.slice(PHOTO_PREFIX.length);
        const lastDash = rest.lastIndexOf("-");
        const orderId = lastDash >= 0 ? rest.slice(0, lastDash) : rest;
        const order = byId.get(orderId);
        let remove = false;
        if (!order) remove = true;
        else if (order.archived) remove = true;
        else {
          try {
            const r = await store.get(k);
            const t = r ? JSON.parse(r.value).t || 0 : 0;
            const stamp = t || new Date(order.createdAt || 0).getTime();
            if (stamp < cutoff) remove = true;
          } catch {
          }
        }
        if (remove) {
          try {
            await store.delete(k);
          } catch {
          }
        }
      }
    } catch {
    }
  }
  var fmtBytes = (b) => {
    if (b < 1024) return `${b} B`;
    if (b < 1024 * 1024) return `${(b / 1024).toFixed(0)} KB`;
    return `${(b / 1024 / 1024).toFixed(1)} MB`;
  };
  function menuForPrompt(menu) {
    const lines = [];
    Object.entries(menu).forEach(([cat, items]) => {
      items.forEach((item) => {
        item.variants.forEach((v) => {
          lines.push(`category="${cat}" name="${item.name}" variant="${v.label}" price=$${v.price}`);
        });
      });
    });
    return lines.join("\n");
  }
  async function fileToJpegBase64(file, maxDim = 1100, quality = 0.72) {
    const draw = (source, width, height) => {
      const scale = Math.min(1, maxDim / Math.max(width, height));
      const w = Math.max(1, Math.round(width * scale));
      const h = Math.max(1, Math.round(height * scale));
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      canvas.getContext("2d").drawImage(source, 0, 0, w, h);
      const dataUrl = canvas.toDataURL("image/jpeg", quality);
      if (!dataUrl || dataUrl.length < 100) throw new Error("Image conversion produced no data");
      return dataUrl.split(",")[1];
    };
    if (typeof createImageBitmap === "function") {
      try {
        const bmp = await createImageBitmap(file);
        const result = draw(bmp, bmp.width, bmp.height);
        bmp.close && bmp.close();
        return result;
      } catch (e) {
      }
    }
    return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        try {
          resolve(draw(img, img.naturalWidth || img.width, img.naturalHeight || img.height));
        } catch (e) {
          reject(e);
        } finally {
          URL.revokeObjectURL(url);
        }
      };
      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error("Could not decode image"));
      };
      img.src = url;
    });
  }
  async function parseOrderText(messageText, imageBase64, menu) {
    const intro = imageBase64 ? `You are an order parser for a small meal prep business. A customer sent a PHOTO of the menu with items circled, highlighted, or marked \u2014 possibly with handwritten notes on it${messageText ? ", along with this text message" : ""}.
Identify which menu items are circled/marked in the photo, and read any handwritten notes (like "sauce on side") into "notes".${messageText ? `

Their accompanying text:
"""
${messageText}
"""` : ""}` : `You are an order parser for a small meal prep business. A customer sent this text message with their order:

"""
${messageText}
"""`;
    const prompt = `${intro}

Here is the complete CURRENT menu. Each line is one orderable option:
${menuForPrompt(menu)}

Match what the customer asked for to menu options. Rules:
- Use EXACT category, name, and variant strings from the menu above.
- The customer may be looking at an OLDER version of the menu. If a marked item does not exist on the current menu, do NOT substitute a similar item \u2014 describe it in "notes" instead so the chef can follow up.
- If the customer mentions returning or swapping a jar for a jar item, choose the "With jar swap" variant of that item if one exists.
- "jarSwaps" should equal the number of jar items ordered with the jar-swap variant.
- "containerReturns" is the number of meal containers the customer says they will return (not jars).
- PER-ITEM NOTES: if a request clearly attaches to ONE specific item (e.g. "chili oil on the side", "extra spicy", "no cilantro"), put it in that item's "note" field, NOT in the order-level notes.
- ADD-ONS: some items have add-on options baked into their variants (e.g. a dish with a "+ Asian Greens" or "With Mushrooms" variant). If the customer asks for an add-on that EXISTS as a variant of that item (look for variants with + or "With" in the label, or a higher price than the base), select that upgraded variant \u2014 do NOT create an upcharge and do NOT flag it. Example: customer says "small mushroom noodles with Asian greens" \u2192 select variant "Small (~3-4) + Asian Greens", not "Small (~3-4)".
- OFF-MENU EXTRAS (upcharge): only if the customer asks to add something to an item that is NOT an available variant of that item (e.g. "add mushrooms" to a dish that has no mushroom option), set that item's "upcharge" to {"label":"short description","amount":null} with amount null. Do NOT also write a reviewReason for it \u2014 the app detects unpriced upcharges automatically. Just set the upcharge object.
- WEIGHT FOR PROTEINS: items named exactly "Ribeye", "NY Strip", "Filet Mignon", or "Chicken Breast" are priced by the pound, weighed by the chef after shopping. Do NOT price them, do NOT set an upcharge, and do NOT write a reviewReason about their weight. If the customer mentions an intended amount (e.g. "1 lb chicken", "ribeye about half a pound", "a 12 oz NY strip"), put that amount in the item's "note" field as a reminder (e.g. note "about 1 lb"). Always leave "weight" null.
- Order-level "notes" is only for things that don't attach to a single item (delivery time, general messages).
- CARROTS: if someone says "carrots" without qualification, match it to the sous vide bag item (category "bag", name "Carrots", variant "2 servings"). Only match to "Pickled Onions or Carrots" if they specifically say "pickled carrots".
- reviewReasons: ONLY use this for genuine ambiguity the app cannot detect on its own \u2014 an unclear quantity, an item you couldn't confidently match, or a confusing request. Do NOT add reviewReasons for unpriced upcharges or for protein weights; those are handled automatically. If everything is clear, return an empty reviewReasons array.

Respond with ONLY a JSON object, no markdown fences, no explanation. Shape:
{"items":[{"category":"...","name":"...","variant":"...","qty":1,"note":"","upcharge":null,"weight":null}],"jarSwaps":0,"containerReturns":0,"notes":"","reviewReasons":[]}`;
    const content = imageBase64 ? [
      { type: "image", source: { type: "base64", media_type: "image/jpeg", data: imageBase64 } },
      { type: "text", text: prompt }
    ] : prompt;
    let response;
    try {
      response = await fetch("https://ltb-proxy.strickland-kevinj.workers.dev/parse-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-6",
          max_tokens: 2e3,
          messages: [{ role: "user", content }]
        })
      });
    } catch (e) {
      throw new Error(`[network layer] ${e && e.message ? e.message : "request failed"}`);
    }
    const raw = await response.text();
    let data;
    try {
      data = JSON.parse(raw);
    } catch (e) {
      throw new Error(`Non-JSON response (HTTP ${response.status}): ${raw.slice(0, 180)}`);
    }
    if (data.error) {
      const detail = typeof data.error === "string" ? data.error : data.error.message || JSON.stringify(data.error);
      throw new Error(`HTTP ${response.status} \u2014 ${String(detail).slice(0, 120)} \u2014 raw: ${raw.slice(0, 180)}`);
    }
    if (!response.ok) {
      throw new Error(`API ${response.status}: ${raw.slice(0, 180)}`);
    }
    const text = (data.content || []).map((b) => b.type === "text" ? b.text : "").join("");
    if (!text.trim()) {
      throw new Error(`Empty response from parser \u2014 HTTP ${response.status}, raw: ${raw.slice(0, 120)}`);
    }
    const clean = text.replace(/```json|```/g, "").trim();
    const jsonMatch = clean.match(/\{[\s\S]*\}/);
    const parsed = JSON.parse(jsonMatch ? jsonMatch[0] : clean);
    return validateParsedOrder(parsed, menu);
  }
  function validateParsedOrder(parsed, menu) {
    const items = [];
    const misses = [];
    (parsed.items || []).forEach((pi) => {
      let matched = null;
      const cats = pi.category && menu[pi.category] ? [pi.category] : Object.keys(menu);
      for (const cat of cats) {
        const menuItem = menu[cat].find((m) => m.name.toLowerCase() === String(pi.name || "").toLowerCase());
        if (menuItem) {
          const variant = menuItem.variants.find((v) => v.label.toLowerCase() === String(pi.variant || "").toLowerCase()) || (menuItem.variants.length === 1 ? menuItem.variants[0] : null);
          if (variant) {
            let upcharge = null;
            if (!isPerLbItem(menuItem.name) && pi.upcharge && (pi.upcharge.label || pi.upcharge.amount != null)) {
              upcharge = {
                label: String(pi.upcharge.label || "Upcharge").slice(0, 40),
                amount: typeof pi.upcharge.amount === "number" ? pi.upcharge.amount : 0
              };
            }
            matched = {
              category: cat,
              name: menuItem.name,
              variant: variant.label,
              price: variant.price,
              cost: variant.cost,
              qty: Math.max(1, parseInt(pi.qty) || 1),
              note: pi.note ? String(pi.note).slice(0, 200) : "",
              upcharge
            };
            if (isPerLbItem(menuItem.name)) {
              matched.weightPending = true;
              matched.price = 0;
              matched.cost = 0;
              matched.weight = void 0;
            }
            break;
          }
        }
      }
      if (matched) {
        const dup = items.find((i) => i.category === matched.category && i.name === matched.name && i.variant === matched.variant && !i.note && !i.upcharge && !matched.note && !matched.upcharge);
        if (dup) dup.qty += matched.qty;
        else items.push(matched);
      } else misses.push(`${pi.qty || 1}x ${pi.name || "?"} ${pi.variant ? `(${pi.variant})` : ""}`.trim());
    });
    let notes = String(parsed.notes || "").trim();
    const overlapRe = /\b(upcharge|price|weigh|weight|pound|per lb|per-lb|couldn'?t match|could not match|not on the menu|off[- ]menu)\b/i;
    const reviewReasons = (Array.isArray(parsed.reviewReasons) ? parsed.reviewReasons : []).map((r) => String(r).trim()).filter(Boolean).filter((r) => !overlapRe.test(r));
    if (misses.length > 0) {
      reviewReasons.push(`Couldn't match to this week's menu: ${misses.join(", ")}`);
      notes = [notes, `Could not auto-match: ${misses.join(", ")} \u2014 review!`].filter(Boolean).join("\n");
    }
    items.forEach((it) => {
      if (it.upcharge && !it.upcharge.amount) {
        reviewReasons.push(`Set a price for "${it.upcharge.label}" on ${it.name}`);
      }
    });
    const seen = /* @__PURE__ */ new Set();
    const dedupedReasons = reviewReasons.filter((r) => {
      const k = r.toLowerCase();
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    });
    return {
      items,
      jarSwaps: Math.max(0, parseInt(parsed.jarSwaps) || 0),
      containerReturns: Math.max(0, parseInt(parsed.containerReturns) || 0),
      notes,
      reviewReasons: dedupedReasons
    };
  }
  async function parseAmendment(order, messageText, menu) {
    const currentLines = (order.items || []).map((it) => {
      const bits = [`${it.qty}x ${it.name} (${it.variant})`];
      if (it.note) bits.push(`note: ${it.note}`);
      if (it.upcharge && it.upcharge.label) bits.push(`upcharge: ${it.upcharge.label}${it.upcharge.amount ? ` $${it.upcharge.amount}` : " (unpriced)"}`);
      return "  - " + bits.join(", ");
    }).join("\n");
    const currentExtras = [];
    if (order.jarSwaps > 0) currentExtras.push(`jarSwaps: ${order.jarSwaps}`);
    if (order.containerReturns > 0) currentExtras.push(`containerReturns: ${order.containerReturns}`);
    if (order.notes) currentExtras.push(`order notes: ${order.notes}`);
    const prompt = `You are an order parser for a small meal prep business. An EXISTING order needs to be amended based on a new follow-up message from the customer.

THE CURRENT ORDER (for ${order.customer}):
${currentLines || "  (no items)"}
${currentExtras.length ? currentExtras.join("\n") : ""}

THE FOLLOW-UP MESSAGE:
"""
${messageText}
"""

Here is the complete CURRENT menu. Each line is one orderable option:
${menuForPrompt(menu)}

Apply the customer's requested changes to the current order and return the COMPLETE updated order (not just the changes). Keep every existing item that wasn't changed, exactly as it was (same variant, note, upcharge). Apply additions, removals, quantity changes, and variant changes as requested. Follow these rules:
- Use EXACT category, name, and variant strings from the menu.
- Keep existing per-item notes and upcharges unless the customer's message changes them.
- ADD-ONS: if the customer asks for an add-on that EXISTS as a variant of an item, switch to that variant. Do not create an upcharge for it.
- OFF-MENU EXTRAS: only if they ask to add something that is NOT an available variant, set that item's "upcharge" to {"label":"...","amount":null}. Do not also add a reviewReason for it.
- PER-LB PROTEINS (Ribeye, NY Strip, Filet Mignon, Chicken Breast): never price or weight them; put any stated amount in the item "note". Leave weight null.
- reviewReasons: ONLY for genuine ambiguity you cannot resolve (an unclear request, an item you couldn't match). Do not flag upcharges or weights.

Respond with ONLY a JSON object, no markdown fences, no explanation. Shape:
{"items":[{"category":"...","name":"...","variant":"...","qty":1,"note":"","upcharge":null,"weight":null}],"jarSwaps":0,"containerReturns":0,"notes":"","reviewReasons":[]}`;
    let response;
    try {
      response = await fetch("https://ltb-proxy.strickland-kevinj.workers.dev/parse-amendment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-6",
          max_tokens: 2e3,
          messages: [{ role: "user", content: prompt }]
        })
      });
    } catch (e) {
      throw new Error(`[network layer] ${e && e.message ? e.message : "request failed"}`);
    }
    const raw = await response.text();
    let data;
    try {
      data = JSON.parse(raw);
    } catch (e) {
      throw new Error(`Non-JSON response (HTTP ${response.status}): ${raw.slice(0, 180)}`);
    }
    if (data.error) {
      const detail = typeof data.error === "string" ? data.error : data.error.message || JSON.stringify(data.error);
      throw new Error(`HTTP ${response.status} \u2014 ${String(detail).slice(0, 120)}`);
    }
    if (!response.ok) throw new Error(`API ${response.status}: ${raw.slice(0, 180)}`);
    const text = (data.content || []).map((b) => b.type === "text" ? b.text : "").join("");
    if (!text.trim()) throw new Error("Empty response from parser");
    const clean = text.replace(/```json|```/g, "").trim();
    const jsonMatch = clean.match(/\{[\s\S]*\}/);
    const parsed = JSON.parse(jsonMatch ? jsonMatch[0] : clean);
    const validated = validateParsedOrder(parsed, menu);
    return {
      ...validated,
      id: order.id,
      customer: order.customer,
      status: order.status,
      paid: order.paid,
      archived: order.archived,
      createdAt: order.createdAt,
      discountType: order.discountType,
      discountValue: order.discountValue,
      customCharges: order.customCharges || [],
      _amended: true
    };
  }
  function ImportModal({ onSubmit, onCancel }) {
    const [text, setText] = (0, import_react.useState)("");
    return /* @__PURE__ */ import_react.default.createElement("div", { style: styles.invoiceOverlay, onClick: onCancel }, /* @__PURE__ */ import_react.default.createElement("div", { style: styles.importModalCard, onClick: (e) => e.stopPropagation() }, /* @__PURE__ */ import_react.default.createElement("div", { style: styles.reviewModalHeader }, /* @__PURE__ */ import_react.default.createElement("div", { style: styles.reviewModalTitle }, "Paste backup"), /* @__PURE__ */ import_react.default.createElement("button", { style: styles.iconBtn, onClick: onCancel, "aria-label": "Cancel" }, /* @__PURE__ */ import_react.default.createElement(X, { size: 18 }))), /* @__PURE__ */ import_react.default.createElement("div", { style: styles.importModalHint }, "Open your backup note, select all, copy, then long-press in the box below and paste."), /* @__PURE__ */ import_react.default.createElement(
      "textarea",
      {
        style: { ...styles.textarea, minHeight: "140px", fontSize: "11px", fontFamily: "monospace" },
        placeholder: "Paste your LTB backup JSON here...",
        value: text,
        onChange: (e) => setText(e.target.value),
        autoFocus: true
      }
    ), /* @__PURE__ */ import_react.default.createElement(
      "button",
      {
        style: { ...styles.saveBtn, ...text.trim() ? {} : styles.saveBtnDisabled },
        disabled: !text.trim(),
        onClick: () => onSubmit(text)
      },
      "Restore orders"
    )));
  }
  function LTBOrderTracker() {
    import_react.default.useEffect(() => {
      if (!document.getElementById("ltb-spin-style")) {
        const s = document.createElement("style");
        s.id = "ltb-spin-style";
        s.textContent = "@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }";
        document.head.appendChild(s);
      }
    }, []);
    const [orders, setOrders] = (0, import_react.useState)(null);
    const [cookChecks, setCookChecks] = (0, import_react.useState)({});
    const [shopping, setShopping] = (0, import_react.useState)([]);
    const [weekDishes, setWeekDishes] = (0, import_react.useState)(DEFAULT_WEEK);
    const [loading, setLoading] = (0, import_react.useState)(true);
    const [error, setError] = (0, import_react.useState)(null);
    const [view, setView] = (0, import_react.useState)("orders");
    const [formMode, setFormMode] = (0, import_react.useState)(null);
    const [showPaste, setShowPaste] = (0, import_react.useState)(false);
    const [showAmend, setShowAmend] = (0, import_react.useState)(false);
    const [showCsv, setShowCsv] = (0, import_react.useState)(false);
    const [pendingOrders, setPendingOrders] = (0, import_react.useState)([]);
    const [showPendingIdx, setShowPendingIdx] = (0, import_react.useState)(null);
    const [checkingForm, setCheckingForm] = (0, import_react.useState)(false);
    const [parsedNotes, setParsedNotes] = (0, import_react.useState)({});
    const [parsingNotes, setParsingNotes] = (0, import_react.useState)(null);
    const [regulars, setRegulars] = (0, import_react.useState)([]);
    const [inventory, setInventory] = (0, import_react.useState)({});
    const [linkPrompt, setLinkPrompt] = (0, import_react.useState)(null);
    const [expandedOrder, setExpandedOrder] = (0, import_react.useState)(null);
    (0, import_react.useEffect)(() => {
      let mounted = true;
      (async () => {
        const [loadedOrders, loadedChecks, loadedShopping, loadedWeek] = await Promise.all([
          loadJSON(ORDERS_KEY, []),
          loadJSON(CHECKS_KEY, {}),
          loadJSON(SHOPPING_KEY, []),
          loadJSON(WEEK_KEY, null)
        ]);
        if (!mounted) return;
        const migrated = loadedOrders.map((o) => ({
          ...o,
          // Item-level migration: form-imported orders previously stored
          // `upcharge: 0` (a number) and `lbs: null`, which broke rendering.
          // Normalize upcharge to either a proper {label, amount} object or
          // undefined, and drop the stray lbs field.
          items: (o.items || []).map((it) => {
            const clean = { ...it };
            if (clean.upcharge != null && typeof clean.upcharge !== "object") {
              delete clean.upcharge;
            }
            if ("lbs" in clean) delete clean.lbs;
            return clean;
          }),
          paid: o.paid === void 0 ? o.status === "Delivered" : o.paid,
          archived: o.archived || false,
          discountType: o.discountType || null,
          discountValue: o.discountValue || 0,
          customCharges: o.customCharges || [],
          jarSwaps: o.jarSwaps || 0,
          containerReturns: o.containerReturns || 0,
          waiveSurcharge: o.waiveSurcharge || false,
          total: Number(o.total) || 0
        }));
        setOrders(migrated);
        setCookChecks(loadedChecks || {});
        setShopping(loadedShopping || []);
        if (loadedWeek && Array.isArray(loadedWeek.selected)) {
          const valid = loadedWeek.selected.filter((n) => ALL_DINNERS.some((d) => d.name === n));
          setWeekDishes(valid.length > 0 ? valid : DEFAULT_WEEK);
        }
        const savedPending = await loadJSON(PENDING_KEY, []);
        if (mounted) setPendingOrders(savedPending || []);
        const savedRegulars = await loadJSON(REGULARS_KEY, []);
        if (mounted) setRegulars(savedRegulars || []);
        const savedInventory = await loadJSON(INVENTORY_KEY, {});
        if (mounted) setInventory(savedInventory || {});
        setLoading(false);
        cleanupPhotos(migrated);
        pollFormOrders(migrated, savedPending || []);
      })();
      return () => {
        mounted = false;
      };
    }, []);
    const persistOrders = (0, import_react.useCallback)(async (next) => {
      setOrders(next);
      const res = await saveJSON(ORDERS_KEY, next);
      setError(saveError(res));
      return res;
    }, []);
    const persistShopping = (0, import_react.useCallback)((next) => {
      setShopping(next);
      saveJSON(SHOPPING_KEY, next).then((res) => setError(saveError(res)));
    }, []);
    const saveOrder = (0, import_react.useCallback)((order) => {
      setOrders((prev) => {
        const exists = (prev || []).some((o) => o.id === order.id);
        const next = exists ? (prev || []).map((o) => o.id === order.id ? order : o) : [order, ...prev || []];
        saveJSON(ORDERS_KEY, next).then((res) => setError(saveError(res)));
        return next;
      });
      setFormMode(null);
    }, []);
    const importOrders = (0, import_react.useCallback)((parsedOrders) => {
      const newOrders = parsedOrders.map((p) => {
        const items = p.items || [];
        const total = orderTotal(items, p.jarSwaps || 0, p.containerReturns || 0, null, 0, [], false);
        return {
          id: uid(),
          customer: p.customer,
          items,
          jarSwaps: p.jarSwaps || 0,
          containerReturns: p.containerReturns || 0,
          notes: p.notes || "",
          discountType: null,
          discountValue: 0,
          customCharges: [],
          waiveSurcharge: false,
          total,
          status: "Ordered",
          paid: false,
          archived: false,
          createdAt: (/* @__PURE__ */ new Date()).toISOString()
        };
      });
      setOrders((prev) => {
        const next = [...newOrders, ...prev || []];
        saveJSON(ORDERS_KEY, next).then((res) => setError(saveError(res)));
        return next;
      });
      setShowCsv(false);
      setExportMsg(`Imported ${newOrders.length} order${newOrders.length !== 1 ? "s" : ""} from the sheet.`);
      setTimeout(() => setExportMsg(null), 4e3);
    }, []);
    const checkFormNow = import_react.default.useCallback(async () => {
      setCheckingForm(true);
      try {
        alert("Fetching from: " + FORM_CSV_URL);
        const rows = await fetchFormRows();
        alert("Done. rows=" + (rows === null ? "null" : Array.isArray(rows) ? rows.length : typeof rows));
        if (!rows) {
          setCheckingForm(false);
          return;
        }
        const seenRaw = await loadJSON(SEEN_ROWS_KEY, {});
        const seen = seenRaw || {};
        const newPending = [];
        rows.forEach((row) => {
          const ts = row["Timestamp"] || row["timestamp"] || "";
          if (!ts || seen[ts]) return;
          const { customer, items, notes } = parseFormRow(row);
          if (items.length === 0 && !notes) return;
          newPending.push({
            pendingId: "p_" + Date.now() + "_" + Math.random().toString(36).slice(2),
            timestamp: ts,
            customer,
            items,
            notes
          });
          seen[ts] = true;
        });
        if (newPending.length > 0) {
          setPendingOrders((prev) => {
            const updated = [...prev, ...newPending];
            saveJSON(PENDING_KEY, updated);
            return updated;
          });
          await saveJSON(SEEN_ROWS_KEY, seen);
        } else {
          await saveJSON(SEEN_ROWS_KEY, seen);
        }
      } catch (e) {
        alert("ERROR: " + e.message);
      }
      setCheckingForm(false);
    }, []);
    const resetRecentSeenRows = import_react.default.useCallback(async () => {
      const seenRaw = await loadJSON(SEEN_ROWS_KEY, {});
      const seen = seenRaw || {};
      const cutoff = Date.now() - 7 * 24 * 60 * 60 * 1e3;
      let removed = 0;
      const updated = {};
      Object.entries(seen).forEach(([ts, val]) => {
        const parsed = new Date(ts);
        if (!isNaN(parsed.getTime()) && parsed.getTime() >= cutoff) {
          removed++;
        } else {
          updated[ts] = val;
        }
      });
      await saveJSON(SEEN_ROWS_KEY, updated);
      alert("Reset " + removed + " recent order" + (removed !== 1 ? "s" : "") + ' from seen history. Tap "Check for new orders" to re-import them.');
    }, []);
    const pollFormOrders = import_react.default.useCallback(async (existingOrders, existingPending) => {
      const rows = await fetchFormRows();
      if (!rows) return;
      const seenRaw = await loadJSON(SEEN_ROWS_KEY, {});
      const seen = seenRaw || {};
      const newPending = [];
      rows.forEach((row) => {
        const ts = row["Timestamp"] || row["timestamp"] || "";
        if (!ts || seen[ts]) return;
        const { customer, items, notes } = parseFormRow(row);
        if (items.length === 0 && !notes) return;
        newPending.push({
          pendingId: "p_" + Date.now() + "_" + Math.random().toString(36).slice(2),
          timestamp: ts,
          customer,
          items,
          notes
        });
        seen[ts] = true;
      });
      if (newPending.length > 0) {
        const updated = [...existingPending, ...newPending];
        setPendingOrders(updated);
        await saveJSON(PENDING_KEY, updated);
        await saveJSON(SEEN_ROWS_KEY, seen);
      } else {
        await saveJSON(SEEN_ROWS_KEY, seen);
      }
      setTimeout(() => pollFormOrders(existingOrders, existingPending), 5 * 60 * 1e3);
    }, []);
    const acceptPending = (0, import_react.useCallback)((pending) => {
      const orderId = uid();
      let exactReg = null;
      const partialRegs = [];
      regulars.forEach((r) => {
        const m = nameMatchType(r.name, pending.customer);
        if (m === "exact") exactReg = r;
        else if (m === "partial") partialRegs.push(r);
      });
      const discountType = exactReg && exactReg.discountPercent > 0 ? "percent" : null;
      const discountValue = exactReg && exactReg.discountPercent > 0 ? exactReg.discountPercent : 0;
      const total = orderTotal(pending.items, 0, 0, discountType, discountValue, [], false);
      const order = {
        id: orderId,
        customer: exactReg ? exactReg.name : pending.customer,
        items: pending.items,
        jarSwaps: 0,
        containerReturns: 0,
        notes: pending.notes || "",
        discountType,
        discountValue,
        customCharges: [],
        waiveSurcharge: false,
        total,
        status: "Ordered",
        paid: false,
        archived: false,
        regularId: exactReg ? exactReg.id : null,
        createdAt: (/* @__PURE__ */ new Date()).toISOString()
      };
      setOrders((prev) => {
        const next = [order, ...prev || []];
        saveJSON(ORDERS_KEY, next).then((res) => setError(saveError(res)));
        return next;
      });
      if (exactReg) {
        linkOrderToRegular(exactReg.id, orderId);
      } else if (partialRegs.length > 0) {
        setLinkPrompt({ order, candidates: partialRegs });
      }
      dismissPending(pending.pendingId);
      setShowPendingIdx(null);
    }, [regulars, linkOrderToRegular]);
    const dismissPending = (0, import_react.useCallback)((pendingId) => {
      setPendingOrders((prev) => {
        const next = prev.filter((p) => p.pendingId !== pendingId);
        saveJSON(PENDING_KEY, next);
        return next;
      });
      setShowPendingIdx(null);
    }, []);
    const persistRegulars = (0, import_react.useCallback)((next) => {
      setRegulars(next);
      saveJSON(REGULARS_KEY, next).then((res) => setError(saveError(res)));
    }, []);
    const addRegular = (0, import_react.useCallback)((profile) => {
      const reg = {
        id: uid(),
        name: profile.name || "",
        address: profile.address || "",
        phone: profile.phone || "",
        dietary: profile.dietary || "",
        spice: profile.spice || "",
        discountPercent: Number(profile.discountPercent) || 0,
        notes: profile.notes || "",
        linkedOrderIds: profile.linkedOrderIds || [],
        lastInsightSig: "",
        createdAt: (/* @__PURE__ */ new Date()).toISOString()
      };
      setRegulars((prev) => {
        const next = [...prev, reg];
        saveJSON(REGULARS_KEY, next).then((res) => setError(saveError(res)));
        return next;
      });
      return reg.id;
    }, []);
    const updateRegular = (0, import_react.useCallback)((id, patch) => {
      setRegulars((prev) => {
        const next = prev.map((r) => r.id === id ? { ...r, ...patch } : r);
        saveJSON(REGULARS_KEY, next).then((res) => setError(saveError(res)));
        return next;
      });
    }, []);
    const deleteRegular = (0, import_react.useCallback)((id) => {
      setRegulars((prev) => {
        const next = prev.filter((r) => r.id !== id);
        saveJSON(REGULARS_KEY, next).then((res) => setError(saveError(res)));
        return next;
      });
    }, []);
    const linkOrderToRegular = (0, import_react.useCallback)((regularId, orderId) => {
      setRegulars((prev) => {
        const next = prev.map((r) => {
          if (r.id !== regularId) return r;
          const linkedOrderIds = r.linkedOrderIds.includes(orderId) ? r.linkedOrderIds : [...r.linkedOrderIds, orderId];
          return { ...r, linkedOrderIds };
        });
        saveJSON(REGULARS_KEY, next).then((res) => setError(saveError(res)));
        return next;
      });
    }, []);
    const unlinkOrderFromRegular = (0, import_react.useCallback)((regularId, orderId) => {
      setRegulars((prev) => {
        const next = prev.map(
          (r) => r.id === regularId ? { ...r, linkedOrderIds: r.linkedOrderIds.filter((oid) => oid !== orderId) } : r
        );
        saveJSON(REGULARS_KEY, next).then((res) => setError(saveError(res)));
        return next;
      });
    }, []);
    const adjustInventory = (0, import_react.useCallback)((key, delta) => {
      setInventory((prev) => {
        const current = Number(prev[key]) || 0;
        const next = { ...prev, [key]: Math.max(0, current + delta) };
        saveJSON(INVENTORY_KEY, next).then((res) => setError(saveError(res)));
        return next;
      });
    }, []);
    const setInventoryCount = (0, import_react.useCallback)((key, value) => {
      setInventory((prev) => {
        const next = { ...prev, [key]: Math.max(0, Number(value) || 0) };
        saveJSON(INVENTORY_KEY, next).then((res) => setError(saveError(res)));
        return next;
      });
    }, []);
    const updateOrder = (0, import_react.useCallback)((id, patch) => {
      setOrders((prev) => {
        const next = (prev || []).map((o) => o.id === id ? { ...o, ...patch } : o);
        saveJSON(ORDERS_KEY, next).then((res) => setError(saveError(res)));
        return next;
      });
    }, []);
    const deleteOrder = (0, import_react.useCallback)((id) => {
      setOrders((prev) => {
        const target = (prev || []).find((o) => o.id === id);
        if (target) (target.items || []).forEach((it, i) => {
          if (it.hasPhoto) deletePhoto(id, i);
        });
        const next = (prev || []).filter((o) => o.id !== id);
        saveJSON(ORDERS_KEY, next).then((res) => setError(saveError(res)));
        return next;
      });
    }, []);
    const archiveDelivered = (0, import_react.useCallback)(() => {
      persistOrders((orders || []).map(
        (o) => o.status === "Delivered" && !o.archived ? { ...o, archived: true } : o
      ));
    }, [orders, persistOrders]);
    const [exportMsg, setExportMsg] = (0, import_react.useState)(null);
    const exportData = (0, import_react.useCallback)(async () => {
      const payload = {
        version: "ltb-v1",
        exportedAt: (/* @__PURE__ */ new Date()).toISOString(),
        orders: orders || [],
        shopping,
        weekDishes
      };
      const json = JSON.stringify(payload, null, 2);
      try {
        await navigator.clipboard.writeText(json);
        setExportMsg("Copied! Paste into Notes or anywhere to save.");
      } catch {
        try {
          const ta = document.createElement("textarea");
          ta.value = json;
          ta.style.position = "fixed";
          ta.style.opacity = "0";
          document.body.appendChild(ta);
          ta.select();
          document.execCommand("copy");
          document.body.removeChild(ta);
          setExportMsg("Copied! Paste into Notes or anywhere to save.");
        } catch {
          setExportMsg("Could not copy automatically. Try the export from Safari (not home screen).");
        }
      }
      setTimeout(() => setExportMsg(null), 4e3);
    }, [orders, shopping, weekDishes]);
    const importData = (0, import_react.useCallback)(async (e) => {
      let json;
      if (typeof e === "string") {
        json = e;
      } else {
        const file = e.target.files && e.target.files[0];
        if (!file) return;
        e.target.value = "";
        json = await new Promise((res, rej) => {
          const r = new FileReader();
          r.onload = (ev) => res(ev.target.result);
          r.onerror = () => rej(new Error("Could not read file"));
          r.readAsText(file);
        });
      }
      try {
        const payload = JSON.parse(json);
        if (!payload.version || !Array.isArray(payload.orders)) {
          setError("That doesn't look like an LTB backup. Nothing was changed.");
          return;
        }
        const ok = window.confirm(
          `Import ${payload.orders.length} orders from ${payload.exportedAt?.slice(0, 10) || "backup"}?

This will replace your current orders.`
        );
        if (!ok) return;
        const res = await persistOrders(payload.orders);
        if (!res.ok) return;
        if (Array.isArray(payload.shopping)) {
          setShopping(payload.shopping);
          await saveJSON(SHOPPING_KEY, payload.shopping);
        }
        if (Array.isArray(payload.weekDishes)) {
          setWeekDishes(payload.weekDishes);
          await saveJSON(WEEK_KEY, { selected: payload.weekDishes });
        }
        setExportMsg(`Imported ${payload.orders.length} orders successfully.`);
        setTimeout(() => setExportMsg(null), 4e3);
        setError(null);
      } catch {
        setError("Couldn't read that backup \u2014 make sure you copied the full text.");
      }
    }, [persistOrders]);
    const [showImportModal, setShowImportModal] = (0, import_react.useState)(false);
    const pasteImport = (0, import_react.useCallback)(() => {
      setShowImportModal(true);
    }, []);
    const submitImport = (0, import_react.useCallback)(async (text) => {
      setShowImportModal(false);
      if (!text.trim()) return;
      try {
        const payload = JSON.parse(text.trim());
        if (!payload.version || !Array.isArray(payload.orders)) {
          setError("That doesn't look like an LTB backup. Nothing was changed.");
          return;
        }
        const res = await persistOrders(payload.orders);
        if (!res.ok) {
          return;
        }
        if (Array.isArray(payload.shopping)) {
          setShopping(payload.shopping);
          await saveJSON(SHOPPING_KEY, payload.shopping);
        }
        if (Array.isArray(payload.weekDishes)) {
          setWeekDishes(payload.weekDishes);
          await saveJSON(WEEK_KEY, { selected: payload.weekDishes });
        }
        setExportMsg(`Imported ${payload.orders.length} orders successfully.`);
        setTimeout(() => setExportMsg(null), 4e3);
        setError(null);
      } catch {
        setError("Couldn't read that \u2014 make sure you copied the full backup text.");
      }
    }, [persistOrders]);
    const currentOrders = (0, import_react.useMemo)(() => (orders || []).filter((o) => !o.archived), [orders]);
    const activeOrders = (0, import_react.useMemo)(() => currentOrders.filter((o) => o.status !== "Delivered"), [currentOrders]);
    const deliveredOrders = (0, import_react.useMemo)(() => currentOrders.filter((o) => o.status === "Delivered"), [currentOrders]);
    const stats = (0, import_react.useMemo)(() => {
      const booked = currentOrders.reduce((s, o) => s + o.total, 0);
      const unpaid = currentOrders.filter((o) => !o.paid).reduce((s, o) => s + o.total, 0);
      return { active: activeOrders.length, booked: round2(booked), unpaid: round2(unpaid) };
    }, [currentOrders, activeOrders]);
    const activeFinancials = (0, import_react.useMemo)(() => {
      let revenue = 0;
      let cost = 0;
      activeOrders.forEach((o) => {
        revenue += o.total;
        cost += orderCostInfo(o).cost;
      });
      return { revenue: round2(revenue), cost: round2(cost), profit: round2(revenue - cost) };
    }, [activeOrders]);
    const recentCustomers = (0, import_react.useMemo)(() => {
      const seen = /* @__PURE__ */ new Set();
      const names = [];
      for (const o of orders || []) {
        const name = (o.customer || "").trim();
        if (name && !seen.has(name.toLowerCase())) {
          seen.add(name.toLowerCase());
          names.push(name);
        }
        if (names.length >= 6) break;
      }
      return names;
    }, [orders]);
    const cookingList = (0, import_react.useMemo)(() => {
      const map = /* @__PURE__ */ new Map();
      activeOrders.forEach((o) => {
        (o.items || []).forEach((it) => {
          const key = `${it.category}::${it.name}::${it.variant}`;
          if (!map.has(key)) {
            map.set(key, { key, category: it.category, name: it.name, variant: it.variant, qty: 0 });
          }
          map.get(key).qty += it.qty;
        });
      });
      const catOrder = Object.keys(CATEGORY_LABELS);
      return Array.from(map.values()).sort(
        (a, b) => catOrder.indexOf(a.category) - catOrder.indexOf(b.category) || a.name.localeCompare(b.name)
      );
    }, [activeOrders]);
    const toggleCheck = (0, import_react.useCallback)((key) => {
      setCookChecks((prev) => {
        const next = { ...prev, [key]: !prev[key] };
        const validKeys = new Set(cookingList.map((it) => it.key));
        Object.keys(next).forEach((k) => {
          if (!validKeys.has(k)) delete next[k];
        });
        saveJSON(CHECKS_KEY, next);
        return next;
      });
    }, [cookingList]);
    const resetChecks = (0, import_react.useCallback)(() => {
      setCookChecks({});
      saveJSON(CHECKS_KEY, {});
    }, []);
    const menu = (0, import_react.useMemo)(() => buildMenu(weekDishes), [weekDishes]);
    const toggleWeekDish = (0, import_react.useCallback)((name) => {
      setWeekDishes((prev) => {
        const next = prev.includes(name) ? prev.filter((n) => n !== name) : [...prev, name];
        saveJSON(WEEK_KEY, { selected: next }).then((res) => setError(saveError(res)));
        return next;
      });
    }, []);
    const generateShopping = (0, import_react.useCallback)((includeStaples) => {
      const lines = generateShoppingItems(activeOrders, includeStaples);
      setShopping((prev) => {
        const checkedByText = new Map(prev.filter((it) => it.checked).map((it) => [it.text, true]));
        const manual = prev.filter((it) => !it.auto);
        const autos = lines.map((text) => ({
          id: uid(),
          text,
          checked: !!checkedByText.get(text),
          auto: true
        }));
        const next = [...autos, ...manual];
        saveJSON(SHOPPING_KEY, next).then((res) => setError(saveError(res)));
        return next;
      });
    }, [activeOrders]);
    if (loading) {
      return /* @__PURE__ */ import_react.default.createElement("div", { style: styles.page }, /* @__PURE__ */ import_react.default.createElement("div", { style: styles.loadingText }, "Loading orders..."));
    }
    return /* @__PURE__ */ import_react.default.createElement("div", { style: styles.page }, /* @__PURE__ */ import_react.default.createElement("header", { style: styles.header }, /* @__PURE__ */ import_react.default.createElement("div", { style: styles.headerTop }, /* @__PURE__ */ import_react.default.createElement("div", { style: styles.logoMark }, "LTB"), /* @__PURE__ */ import_react.default.createElement("div", { style: styles.headerCenter }, /* @__PURE__ */ import_react.default.createElement("div", { style: styles.title }, "Order tracker"), /* @__PURE__ */ import_react.default.createElement("div", { style: styles.subtitle }, "Lettuce, Turnip, The Beet \xB7 v9.1-GH")), /* @__PURE__ */ import_react.default.createElement("div", { style: styles.headerActions }, /* @__PURE__ */ import_react.default.createElement("button", { style: styles.headerActionBtn, onClick: exportData, title: "Copy backup to clipboard" }, /* @__PURE__ */ import_react.default.createElement(Download, { size: 16 })), /* @__PURE__ */ import_react.default.createElement("button", { style: styles.headerActionBtn, onClick: pasteImport, title: "Paste backup from clipboard" }, /* @__PURE__ */ import_react.default.createElement(Upload, { size: 16 })))), exportMsg && /* @__PURE__ */ import_react.default.createElement("div", { style: styles.exportMsg }, exportMsg), /* @__PURE__ */ import_react.default.createElement("nav", { style: styles.tabs }, [
      ["orders", "Orders"],
      ["cook", "Cook"],
      ["shop", "Shop"],
      ["money", "Money"],
      ["regulars", "Regulars"],
      ["week", "Week"]
    ].map(([key, label]) => /* @__PURE__ */ import_react.default.createElement(
      "button",
      {
        key,
        style: { ...styles.tab, ...view === key ? styles.tabActive : {} },
        onClick: () => setView(key)
      },
      label,
      key === "orders" && stats.active > 0 && /* @__PURE__ */ import_react.default.createElement("span", { style: styles.tabBadge }, stats.active)
    )))), error && /* @__PURE__ */ import_react.default.createElement(
      "button",
      {
        style: styles.errorBanner,
        onClick: async () => {
          const res = await saveJSON(ORDERS_KEY, orders || []);
          setError(saveError(res));
          if (res.ok) {
            setExportMsg("Saved.");
            setTimeout(() => setExportMsg(null), 2500);
          }
        }
      },
      error,
      /* @__PURE__ */ import_react.default.createElement("span", { style: styles.errorRetry }, "Tap to retry saving")
    ), showImportModal && /* @__PURE__ */ import_react.default.createElement(ImportModal, { onSubmit: submitImport, onCancel: () => setShowImportModal(false) }), linkPrompt && /* @__PURE__ */ import_react.default.createElement(
      LinkRegularPrompt,
      {
        order: linkPrompt.order,
        candidates: linkPrompt.candidates,
        onLink: (regularId) => {
          linkOrderToRegular(regularId, linkPrompt.order.id);
          const reg = regulars.find((r) => r.id === regularId);
          if (reg) {
            const patch = { regularId };
            if (reg.discountPercent > 0) {
              patch.discountType = "percent";
              patch.discountValue = reg.discountPercent;
              patch.total = orderTotal(linkPrompt.order.items, linkPrompt.order.jarSwaps, linkPrompt.order.containerReturns, "percent", reg.discountPercent, linkPrompt.order.customCharges, linkPrompt.order.waiveSurcharge);
            }
            updateOrder(linkPrompt.order.id, patch);
          }
          setLinkPrompt(null);
        },
        onSkip: () => setLinkPrompt(null)
      }
    ), /* @__PURE__ */ import_react.default.createElement("main", { style: styles.main }, view === "orders" && /* @__PURE__ */ import_react.default.createElement(import_react.default.Fragment, null, /* @__PURE__ */ import_react.default.createElement(StatsBar, { stats }), !formMode && !showPaste && !showAmend && !showCsv && /* @__PURE__ */ import_react.default.createElement("div", { style: styles.topActions }, /* @__PURE__ */ import_react.default.createElement("button", { style: styles.newOrderBtn, onClick: () => setFormMode("new") }, /* @__PURE__ */ import_react.default.createElement(Plus, { size: 18 }), "New order"), /* @__PURE__ */ import_react.default.createElement("button", { style: styles.pasteBtn, onClick: () => setShowPaste(true) }, /* @__PURE__ */ import_react.default.createElement(ClipboardPaste, { size: 18 }), "Paste a text"), /* @__PURE__ */ import_react.default.createElement("button", { style: styles.amendBtn, onClick: () => setShowAmend(true) }, /* @__PURE__ */ import_react.default.createElement(Pencil, { size: 16 }), "Amend via text"), /* @__PURE__ */ import_react.default.createElement("button", { style: styles.csvBtn, onClick: () => setShowCsv(true) }, /* @__PURE__ */ import_react.default.createElement(FileText, { size: 16 }), "Import from sheet"), /* @__PURE__ */ import_react.default.createElement(
      "button",
      {
        style: styles.checkFormBtn,
        onClick: checkFormNow,
        onContextMenu: (e) => {
          e.preventDefault();
          resetRecentSeenRows();
        },
        onTouchStart: (e) => {
          const t = setTimeout(() => resetRecentSeenRows(), 700);
          e.currentTarget._ltbLongPress = t;
        },
        onTouchEnd: (e) => {
          clearTimeout(e.currentTarget._ltbLongPress);
        },
        onTouchMove: (e) => {
          clearTimeout(e.currentTarget._ltbLongPress);
        },
        disabled: checkingForm
      },
      /* @__PURE__ */ import_react.default.createElement(RotateCcw, { size: 16, style: checkingForm ? styles.spinning : void 0 }),
      checkingForm ? "Checking..." : "Check for new orders"
    )), showPaste && /* @__PURE__ */ import_react.default.createElement(
      PasteOrderCard,
      {
        menu,
        onParsed: (draft) => {
          setShowPaste(false);
          setFormMode(draft);
        },
        onCancel: () => setShowPaste(false)
      }
    ), showAmend && /* @__PURE__ */ import_react.default.createElement(
      AmendOrderCard,
      {
        menu,
        orders: activeOrders,
        onAmended: (draft) => {
          setShowAmend(false);
          setFormMode(draft);
        },
        onCancel: () => setShowAmend(false)
      }
    ), showCsv && /* @__PURE__ */ import_react.default.createElement(
      CsvImportCard,
      {
        menu,
        onImport: importOrders,
        onCancel: () => setShowCsv(false)
      }
    ), formMode && /* @__PURE__ */ import_react.default.createElement(
      OrderForm,
      {
        menu,
        initial: formMode === "new" ? null : formMode,
        recentCustomers,
        onSave: saveOrder,
        onCancel: () => setFormMode(null)
      }
    ), activeOrders.length === 0 && !formMode && !showPaste && pendingOrders.length === 0 && /* @__PURE__ */ import_react.default.createElement("div", { style: styles.emptyState }, /* @__PURE__ */ import_react.default.createElement("div", { style: styles.emptyTitle }, "No active orders"), /* @__PURE__ */ import_react.default.createElement("div", { style: styles.emptyBody }, 'Tap "New order" to build one, "Paste a text" to auto-read an order, or "Import from sheet" to pull in Google Form orders.')), pendingOrders.length > 0 && !formMode && !showPaste && !showCsv && /* @__PURE__ */ import_react.default.createElement("div", { style: styles.pendingSection }, /* @__PURE__ */ import_react.default.createElement("div", { style: styles.pendingSectionHeader }, /* @__PURE__ */ import_react.default.createElement("span", { style: styles.pendingBadge }, pendingOrders.length), /* @__PURE__ */ import_react.default.createElement("span", { style: styles.pendingSectionTitle }, "Pending form order", pendingOrders.length !== 1 ? "s" : "")), pendingOrders.map((p, idx) => showPendingIdx === idx ? /* @__PURE__ */ import_react.default.createElement("div", { key: p.pendingId, style: styles.pendingCard }, /* @__PURE__ */ import_react.default.createElement("div", { style: styles.pendingCardHeader }, /* @__PURE__ */ import_react.default.createElement("div", { style: styles.pendingCardName }, p.customer), /* @__PURE__ */ import_react.default.createElement("div", { style: styles.pendingCardTime }, p.timestamp)), /* @__PURE__ */ import_react.default.createElement("div", { style: styles.pendingItemList }, p.items.map((it, i) => /* @__PURE__ */ import_react.default.createElement("div", { key: i, style: styles.pendingItem }, /* @__PURE__ */ import_react.default.createElement("span", { style: styles.pendingItemName }, it.name), it.variant && /* @__PURE__ */ import_react.default.createElement("span", { style: styles.pendingItemVariant }, " \u2014 ", it.variant), /* @__PURE__ */ import_react.default.createElement("span", { style: styles.pendingItemPrice }, " $", it.price.toFixed(2)))), p.notes && /* @__PURE__ */ import_react.default.createElement("div", { style: styles.pendingNotesSection }, /* @__PURE__ */ import_react.default.createElement("div", { style: styles.pendingNotes }, "Notes: ", p.notes), parsedNotes[p.pendingId] ? /* @__PURE__ */ import_react.default.createElement("div", { style: styles.parsedNotesCard }, /* @__PURE__ */ import_react.default.createElement("div", { style: styles.parsedNotesTitle }, "AI interpretation"), parsedNotes[p.pendingId].summary && /* @__PURE__ */ import_react.default.createElement("div", { style: styles.parsedNotesSummary }, parsedNotes[p.pendingId].summary), ["spice", "substitutions", "extras", "delivery", "other"].map(
      (k) => parsedNotes[p.pendingId][k] ? /* @__PURE__ */ import_react.default.createElement("div", { key: k, style: styles.parsedNotesItem }, /* @__PURE__ */ import_react.default.createElement("span", { style: styles.parsedNotesKey }, k, ":"), " ", parsedNotes[p.pendingId][k]) : null
    )) : /* @__PURE__ */ import_react.default.createElement(
      "button",
      {
        style: styles.parseNotesBtn,
        disabled: parsingNotes === p.pendingId,
        onClick: async () => {
          setParsingNotes(p.pendingId);
          const result = await parseFormNotes(p.notes);
          if (result) setParsedNotes((prev) => ({ ...prev, [p.pendingId]: result }));
          setParsingNotes(null);
        }
      },
      parsingNotes === p.pendingId ? "Parsing..." : "Parse notes with AI"
    ))), /* @__PURE__ */ import_react.default.createElement("div", { style: styles.pendingActions }, /* @__PURE__ */ import_react.default.createElement("button", { style: styles.pendingAcceptBtn, onClick: () => acceptPending(p) }, /* @__PURE__ */ import_react.default.createElement(Check, { size: 16 }), " Accept"), /* @__PURE__ */ import_react.default.createElement("button", { style: styles.pendingRejectBtn, onClick: () => dismissPending(p.pendingId) }, /* @__PURE__ */ import_react.default.createElement(X, { size: 16 }), " Reject"), /* @__PURE__ */ import_react.default.createElement("button", { style: styles.pendingBackBtn, onClick: () => setShowPendingIdx(null) }, "Back"))) : /* @__PURE__ */ import_react.default.createElement("button", { key: p.pendingId, style: styles.pendingRow, onClick: () => setShowPendingIdx(idx) }, /* @__PURE__ */ import_react.default.createElement("span", { style: styles.pendingRowName }, p.customer), /* @__PURE__ */ import_react.default.createElement("span", { style: styles.pendingRowCount }, p.items.length, " item", p.items.length !== 1 ? "s" : ""), /* @__PURE__ */ import_react.default.createElement(ChevronDown, { size: 16 })))), /* @__PURE__ */ import_react.default.createElement("div", { style: styles.orderList }, activeOrders.map((order) => /* @__PURE__ */ import_react.default.createElement(
      OrderCard,
      {
        key: order.id,
        order,
        regulars,
        expanded: expandedOrder === order.id,
        onToggle: () => setExpandedOrder(expandedOrder === order.id ? null : order.id),
        onUpdate: (patch) => updateOrder(order.id, patch),
        onDelete: () => deleteOrder(order.id),
        onEdit: () => {
          setFormMode(order);
          setExpandedOrder(null);
        }
      }
    ))), deliveredOrders.length > 0 && /* @__PURE__ */ import_react.default.createElement("details", { style: styles.deliveredSection }, /* @__PURE__ */ import_react.default.createElement("summary", { style: styles.deliveredSummary }, "Delivered (", deliveredOrders.length, ")"), /* @__PURE__ */ import_react.default.createElement("div", { style: styles.orderList }, deliveredOrders.map((order) => /* @__PURE__ */ import_react.default.createElement(
      OrderCard,
      {
        key: order.id,
        order,
        regulars,
        expanded: expandedOrder === order.id,
        onToggle: () => setExpandedOrder(expandedOrder === order.id ? null : order.id),
        onUpdate: (patch) => updateOrder(order.id, patch),
        onDelete: () => deleteOrder(order.id),
        onEdit: () => {
          setFormMode(order);
          setExpandedOrder(null);
        }
      }
    ))), /* @__PURE__ */ import_react.default.createElement(ArchiveDeliveredButton, { count: deliveredOrders.length, onArchive: archiveDelivered }))), view === "cook" && /* @__PURE__ */ import_react.default.createElement(
      CookingList,
      {
        items: cookingList,
        orderCount: activeOrders.length,
        revenue: activeFinancials.revenue,
        checks: cookChecks,
        onToggle: toggleCheck,
        onReset: resetChecks
      }
    ), view === "shop" && /* @__PURE__ */ import_react.default.createElement(
      ShoppingList,
      {
        items: shopping,
        onChange: persistShopping,
        onGenerate: generateShopping,
        activeCount: activeOrders.length,
        estCost: activeFinancials.cost
      }
    ), view === "money" && /* @__PURE__ */ import_react.default.createElement(MoneyTab, { orders: orders || [], onUpdate: updateOrder }), view === "regulars" && /* @__PURE__ */ import_react.default.createElement(
      RegularsTab,
      {
        regulars,
        orders: orders || [],
        onAdd: addRegular,
        onUpdate: updateRegular,
        onDelete: deleteRegular,
        onLink: linkOrderToRegular,
        onUnlink: unlinkOrderFromRegular
      }
    ), view === "week" && /* @__PURE__ */ import_react.default.createElement(WeekTab, { selected: weekDishes, onToggle: toggleWeekDish })));
  }
  function LinkRegularPrompt({ order, candidates, onLink, onSkip }) {
    return /* @__PURE__ */ import_react.default.createElement("div", { style: styles.invoiceOverlay, onClick: onSkip }, /* @__PURE__ */ import_react.default.createElement("div", { style: styles.linkPromptCard, onClick: (e) => e.stopPropagation() }, /* @__PURE__ */ import_react.default.createElement("div", { style: styles.linkPromptTitle }, "This looks like a regular"), /* @__PURE__ */ import_react.default.createElement("div", { style: styles.linkPromptBody }, "The order from ", /* @__PURE__ */ import_react.default.createElement("b", null, order.customer), " might match one of your regulars. Want to link it?"), /* @__PURE__ */ import_react.default.createElement("div", { style: styles.linkPromptList }, candidates.map((r) => /* @__PURE__ */ import_react.default.createElement("button", { key: r.id, style: styles.linkPromptCandidate, onClick: () => onLink(r.id) }, /* @__PURE__ */ import_react.default.createElement("span", { style: styles.linkPromptCandidateName }, r.name, " \u2605"), r.discountPercent > 0 && /* @__PURE__ */ import_react.default.createElement("span", { style: styles.linkPromptCandidateMeta }, r.discountPercent, "% off applies")))), /* @__PURE__ */ import_react.default.createElement("button", { style: styles.linkPromptSkip, onClick: onSkip }, "Not a regular / skip")));
  }
  function RegularsTab({ regulars, orders, onAdd, onUpdate, onDelete, onLink, onUnlink }) {
    const [mode, setMode] = (0, import_react.useState)("list");
    const [activeId, setActiveId] = (0, import_react.useState)(null);
    const activeRegular = regulars.find((r) => r.id === activeId) || null;
    if (mode === "add") {
      return /* @__PURE__ */ import_react.default.createElement(
        RegularForm,
        {
          onSave: (profile) => {
            onAdd(profile);
            setMode("list");
          },
          onCancel: () => setMode("list")
        }
      );
    }
    if (mode === "profile" && activeRegular) {
      return /* @__PURE__ */ import_react.default.createElement(
        RegularProfile,
        {
          regular: activeRegular,
          orders,
          allRegulars: regulars,
          onUpdate,
          onDelete: (id) => {
            onDelete(id);
            setMode("list");
            setActiveId(null);
          },
          onLink,
          onUnlink,
          onBack: () => {
            setMode("list");
            setActiveId(null);
          }
        }
      );
    }
    return /* @__PURE__ */ import_react.default.createElement("div", null, /* @__PURE__ */ import_react.default.createElement("div", { style: styles.genCard }, /* @__PURE__ */ import_react.default.createElement("div", { style: styles.genTitle }, "Regulars"), /* @__PURE__ */ import_react.default.createElement("div", { style: styles.genHint }, "Your VIP customers. Tap one to see their profile, order history, and the patterns Claude spots over time. New form orders auto-link to a regular when the full name matches exactly.")), /* @__PURE__ */ import_react.default.createElement("button", { style: styles.addRegularBtn, onClick: () => setMode("add") }, /* @__PURE__ */ import_react.default.createElement(Plus, { size: 18 }), " Add a regular"), regulars.length === 0 ? /* @__PURE__ */ import_react.default.createElement("div", { style: styles.emptyState }, /* @__PURE__ */ import_react.default.createElement("div", { style: styles.emptyTitle }, "No regulars yet"), /* @__PURE__ */ import_react.default.createElement("div", { style: styles.emptyBody }, "Add your repeat customers to track their preferences and order history.")) : /* @__PURE__ */ import_react.default.createElement("div", { style: styles.regularsList }, regulars.map((r) => {
      const linkedCount = (r.linkedOrderIds || []).length;
      return /* @__PURE__ */ import_react.default.createElement(
        "button",
        {
          key: r.id,
          style: styles.regularRow,
          onClick: () => {
            setActiveId(r.id);
            setMode("profile");
          }
        },
        /* @__PURE__ */ import_react.default.createElement("div", { style: styles.regularRowLeft }, /* @__PURE__ */ import_react.default.createElement("div", { style: styles.regularRowName }, r.name, " ", /* @__PURE__ */ import_react.default.createElement("span", { style: styles.regularStar }, "\u2605")), /* @__PURE__ */ import_react.default.createElement("div", { style: styles.regularRowMeta }, linkedCount, " order", linkedCount !== 1 ? "s" : "", r.discountPercent > 0 ? ` \xB7 ${r.discountPercent}% off` : "")),
        /* @__PURE__ */ import_react.default.createElement(ChevronDown, { size: 16, style: { transform: "rotate(-90deg)" } })
      );
    })));
  }
  function RegularForm({ regular, onSave, onCancel }) {
    const [name, setName] = (0, import_react.useState)(regular?.name || "");
    const [address, setAddress] = (0, import_react.useState)(regular?.address || "");
    const [phone, setPhone] = (0, import_react.useState)(regular?.phone || "");
    const [dietary, setDietary] = (0, import_react.useState)(regular?.dietary || "");
    const [spice, setSpice] = (0, import_react.useState)(regular?.spice || "");
    const [discountPercent, setDiscountPercent] = (0, import_react.useState)(regular?.discountPercent ? String(regular.discountPercent) : "");
    const canSave = name.trim().length > 0;
    return /* @__PURE__ */ import_react.default.createElement("div", null, /* @__PURE__ */ import_react.default.createElement("div", { style: styles.genCard }, /* @__PURE__ */ import_react.default.createElement("div", { style: styles.genTitle }, regular ? "Edit profile" : "New regular")), /* @__PURE__ */ import_react.default.createElement("div", { style: styles.regularFormCard }, /* @__PURE__ */ import_react.default.createElement("label", { style: styles.miniLabel }, "Name *"), /* @__PURE__ */ import_react.default.createElement("input", { style: styles.input, value: name, onChange: (e) => setName(e.target.value), placeholder: "Full name (helps form orders auto-link)" }), /* @__PURE__ */ import_react.default.createElement("label", { style: styles.miniLabel }, "Address"), /* @__PURE__ */ import_react.default.createElement("input", { style: styles.input, value: address, onChange: (e) => setAddress(e.target.value), placeholder: "For your delivery reference" }), /* @__PURE__ */ import_react.default.createElement("label", { style: styles.miniLabel }, "Phone"), /* @__PURE__ */ import_react.default.createElement("input", { style: styles.input, type: "tel", value: phone, onChange: (e) => setPhone(e.target.value), placeholder: "Phone number" }), /* @__PURE__ */ import_react.default.createElement("label", { style: styles.miniLabel }, "Dietary restrictions"), /* @__PURE__ */ import_react.default.createElement("input", { style: styles.input, value: dietary, onChange: (e) => setDietary(e.target.value), placeholder: "e.g. no peanuts, dairy-free" }), /* @__PURE__ */ import_react.default.createElement("label", { style: styles.miniLabel }, "Preferred spice level"), /* @__PURE__ */ import_react.default.createElement("input", { style: styles.input, value: spice, onChange: (e) => setSpice(e.target.value), placeholder: "e.g. level 3, mild" }), /* @__PURE__ */ import_react.default.createElement("label", { style: styles.miniLabel }, "Lifetime discount (%)"), /* @__PURE__ */ import_react.default.createElement("input", { style: styles.input, type: "number", inputMode: "decimal", value: discountPercent, onChange: (e) => setDiscountPercent(e.target.value), placeholder: "e.g. 20 for Mom, 5 for testers" }), /* @__PURE__ */ import_react.default.createElement("div", { style: styles.regularFormHint }, "Auto-applies to their orders. You can toggle it off per order."), /* @__PURE__ */ import_react.default.createElement("div", { style: styles.regularFormActions }, /* @__PURE__ */ import_react.default.createElement("button", { style: styles.confirmNo, onClick: onCancel }, "Cancel"), /* @__PURE__ */ import_react.default.createElement(
      "button",
      {
        style: { ...styles.confirmYesGreen, opacity: canSave ? 1 : 0.5 },
        disabled: !canSave,
        onClick: () => onSave({ name: name.trim(), address, phone, dietary, spice, discountPercent })
      },
      regular ? "Save changes" : "Add regular"
    ))));
  }
  function RegularProfile({ regular, orders, allRegulars, onUpdate, onDelete, onLink, onUnlink, onBack }) {
    const [editing, setEditing] = (0, import_react.useState)(false);
    const [editingNotes, setEditingNotes] = (0, import_react.useState)(false);
    const [notesDraft, setNotesDraft] = (0, import_react.useState)(regular.notes || "");
    const [showLinkBrowser, setShowLinkBrowser] = (0, import_react.useState)(false);
    const [linkSearch, setLinkSearch] = (0, import_react.useState)("");
    const [confirmDelete, setConfirmDelete] = (0, import_react.useState)(false);
    const linkedOrders = (0, import_react.useMemo)(
      () => (regular.linkedOrderIds || []).map((oid) => orders.find((o) => o.id === oid)).filter(Boolean).sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)),
      [regular.linkedOrderIds, orders]
    );
    const totalOrders = linkedOrders.length;
    const totalSpent = linkedOrders.reduce((s, o) => s + (Number(o.total) || 0), 0);
    const lastOrder = linkedOrders[0];
    const insights = (0, import_react.useMemo)(() => buildInsights(linkedOrders), [linkedOrders]);
    (0, import_react.useEffect)(() => {
      if (insights.length === 0) return;
      const sig = insights.join(" | ");
      if (regular.lastInsightSig === sig) return;
      const existingNotes = regular.notes || "";
      const newLines = insights.filter((text) => !existingNotes.includes(text)).map((text) => insightStamp(text));
      if (newLines.length > 0) {
        const updatedNotes = existingNotes ? existingNotes + "\n" + newLines.join("\n") : newLines.join("\n");
        onUpdate(regular.id, { notes: updatedNotes, lastInsightSig: sig });
        setNotesDraft(updatedNotes);
      } else {
        onUpdate(regular.id, { lastInsightSig: sig });
      }
    }, [insights]);
    const saveNotes = () => {
      onUpdate(regular.id, { notes: notesDraft });
      setEditing(false);
    };
    const linkableOrders = (0, import_react.useMemo)(() => {
      const linkedSet = new Set(regular.linkedOrderIds || []);
      const q = normName(linkSearch);
      return orders.filter((o) => !linkedSet.has(o.id)).filter((o) => !q || normName(o.customer).includes(q)).sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
    }, [orders, regular.linkedOrderIds, linkSearch]);
    if (editing) {
      return /* @__PURE__ */ import_react.default.createElement(
        RegularForm,
        {
          regular,
          onSave: (profile) => {
            onUpdate(regular.id, {
              name: profile.name,
              address: profile.address,
              phone: profile.phone,
              dietary: profile.dietary,
              spice: profile.spice,
              discountPercent: Number(profile.discountPercent) || 0
            });
            setEditing(false);
          },
          onCancel: () => setEditing(false)
        }
      );
    }
    return /* @__PURE__ */ import_react.default.createElement("div", null, /* @__PURE__ */ import_react.default.createElement("button", { style: styles.profileBackBtn, onClick: onBack }, "\u2039 All regulars"), /* @__PURE__ */ import_react.default.createElement("div", { style: styles.profileHeader }, /* @__PURE__ */ import_react.default.createElement("div", { style: styles.profileName }, regular.name, " ", /* @__PURE__ */ import_react.default.createElement("span", { style: styles.regularStar }, "\u2605")), /* @__PURE__ */ import_react.default.createElement("div", { style: styles.profileSummaryGrid }, /* @__PURE__ */ import_react.default.createElement("div", { style: styles.profileStat }, /* @__PURE__ */ import_react.default.createElement("div", { style: styles.profileStatNum }, totalOrders), /* @__PURE__ */ import_react.default.createElement("div", { style: styles.profileStatLabel }, "orders")), /* @__PURE__ */ import_react.default.createElement("div", { style: styles.profileStat }, /* @__PURE__ */ import_react.default.createElement("div", { style: styles.profileStatNum }, currency(totalSpent)), /* @__PURE__ */ import_react.default.createElement("div", { style: styles.profileStatLabel }, "total spent")), /* @__PURE__ */ import_react.default.createElement("div", { style: styles.profileStat }, /* @__PURE__ */ import_react.default.createElement("div", { style: styles.profileStatNum }, lastOrder ? formatDate(lastOrder.createdAt) : "\u2014"), /* @__PURE__ */ import_react.default.createElement("div", { style: styles.profileStatLabel }, "last order"))), regular.discountPercent > 0 && /* @__PURE__ */ import_react.default.createElement("div", { style: styles.profileDiscountBadge }, regular.discountPercent, "% lifetime discount")), /* @__PURE__ */ import_react.default.createElement("div", { style: styles.profileSection }, /* @__PURE__ */ import_react.default.createElement("div", { style: styles.profileSectionTitle }, "Details"), regular.address ? /* @__PURE__ */ import_react.default.createElement("div", { style: styles.profileField }, /* @__PURE__ */ import_react.default.createElement("span", { style: styles.profileFieldKey }, "Address:"), " ", regular.address) : null, regular.phone ? /* @__PURE__ */ import_react.default.createElement("div", { style: styles.profileField }, /* @__PURE__ */ import_react.default.createElement("span", { style: styles.profileFieldKey }, "Phone:"), " ", regular.phone) : null, regular.dietary ? /* @__PURE__ */ import_react.default.createElement("div", { style: styles.profileField }, /* @__PURE__ */ import_react.default.createElement("span", { style: styles.profileFieldKey }, "Dietary:"), " ", regular.dietary) : null, regular.spice ? /* @__PURE__ */ import_react.default.createElement("div", { style: styles.profileField }, /* @__PURE__ */ import_react.default.createElement("span", { style: styles.profileFieldKey }, "Spice:"), " ", regular.spice) : null, !regular.address && !regular.phone && !regular.dietary && !regular.spice && /* @__PURE__ */ import_react.default.createElement("div", { style: styles.profileFieldEmpty }, "No details added yet."), /* @__PURE__ */ import_react.default.createElement("button", { style: styles.profileEditBtn, onClick: () => setEditing(true) }, /* @__PURE__ */ import_react.default.createElement(Pencil, { size: 13 }), " Edit details")), /* @__PURE__ */ import_react.default.createElement("div", { style: styles.profileSection }, /* @__PURE__ */ import_react.default.createElement("div", { style: styles.profileSectionTitle }, "Notes & insights"), editingNotes ? /* @__PURE__ */ import_react.default.createElement(import_react.default.Fragment, null, /* @__PURE__ */ import_react.default.createElement(
      "textarea",
      {
        style: { ...styles.textarea, minHeight: "90px" },
        value: notesDraft,
        onChange: (e) => setNotesDraft(e.target.value),
        placeholder: "Free-form notes. Auto-insights from Claude appear here too, datestamped.",
        autoFocus: true
      }
    ), /* @__PURE__ */ import_react.default.createElement("div", { style: styles.regularFormActions }, /* @__PURE__ */ import_react.default.createElement("button", { style: styles.confirmNo, onClick: () => {
      setNotesDraft(regular.notes || "");
      setEditingNotes(false);
    } }, "Cancel"), /* @__PURE__ */ import_react.default.createElement("button", { style: styles.confirmYesGreen, onClick: saveNotes }, "Save notes"))) : /* @__PURE__ */ import_react.default.createElement(import_react.default.Fragment, null, notesDraft ? /* @__PURE__ */ import_react.default.createElement("div", { style: styles.profileNotes }, notesDraft.split("\n").map((line, i) => /* @__PURE__ */ import_react.default.createElement("div", { key: i, style: line.startsWith("[Auto-insight") ? styles.profileInsightLine : styles.profileNoteLine }, line))) : /* @__PURE__ */ import_react.default.createElement("div", { style: styles.profileFieldEmpty }, "No notes yet. Insights appear automatically after ", MIN_ORDERS_FOR_INSIGHT, " orders."), /* @__PURE__ */ import_react.default.createElement("button", { style: styles.profileEditBtn, onClick: () => {
      setNotesDraft(regular.notes || "");
      setEditingNotes(true);
    } }, /* @__PURE__ */ import_react.default.createElement(Pencil, { size: 13 }), " Edit notes"))), /* @__PURE__ */ import_react.default.createElement("div", { style: styles.profileSection }, /* @__PURE__ */ import_react.default.createElement("div", { style: styles.profileSectionTitle }, "Order history (", totalOrders, ")"), linkedOrders.length === 0 ? /* @__PURE__ */ import_react.default.createElement("div", { style: styles.profileFieldEmpty }, "No orders linked yet.") : /* @__PURE__ */ import_react.default.createElement("div", { style: styles.profileHistoryList }, linkedOrders.map((o) => /* @__PURE__ */ import_react.default.createElement("div", { key: o.id, style: styles.profileHistoryRow }, /* @__PURE__ */ import_react.default.createElement("div", { style: styles.profileHistoryLeft }, /* @__PURE__ */ import_react.default.createElement("div", { style: styles.profileHistoryDate }, o.createdAt ? formatDate(o.createdAt) : "undated"), /* @__PURE__ */ import_react.default.createElement("div", { style: styles.profileHistoryItems }, (o.items || []).map((it) => `${it.qty}\xD7 ${it.name}`).join(", ") || "No items")), /* @__PURE__ */ import_react.default.createElement("div", { style: styles.profileHistoryRight }, /* @__PURE__ */ import_react.default.createElement("span", { style: styles.profileHistoryTotal }, currency(o.total)), /* @__PURE__ */ import_react.default.createElement("button", { style: styles.profileUnlinkBtn, onClick: () => onUnlink(regular.id, o.id) }, "unlink"))))), /* @__PURE__ */ import_react.default.createElement("button", { style: styles.profileLinkBtn, onClick: () => setShowLinkBrowser(!showLinkBrowser) }, showLinkBrowser ? "Close" : "+ Link past orders"), showLinkBrowser && /* @__PURE__ */ import_react.default.createElement("div", { style: styles.linkBrowser }, /* @__PURE__ */ import_react.default.createElement(
      "input",
      {
        style: styles.input,
        placeholder: "Search orders by name...",
        value: linkSearch,
        onChange: (e) => setLinkSearch(e.target.value)
      }
    ), /* @__PURE__ */ import_react.default.createElement("div", { style: styles.linkBrowserList }, linkableOrders.length === 0 ? /* @__PURE__ */ import_react.default.createElement("div", { style: styles.profileFieldEmpty }, "No matching orders to link.") : linkableOrders.slice(0, 30).map((o) => /* @__PURE__ */ import_react.default.createElement("button", { key: o.id, style: styles.linkBrowserRow, onClick: () => onLink(regular.id, o.id) }, /* @__PURE__ */ import_react.default.createElement("div", { style: styles.linkBrowserRowLeft }, /* @__PURE__ */ import_react.default.createElement("span", { style: styles.linkBrowserName }, o.customer), /* @__PURE__ */ import_react.default.createElement("span", { style: styles.linkBrowserItems }, (o.items || []).map((it) => it.name).join(", ").slice(0, 50))), /* @__PURE__ */ import_react.default.createElement("span", { style: styles.linkBrowserMeta }, o.createdAt ? formatDate(o.createdAt) : "", " \xB7 ", currency(o.total))))))), /* @__PURE__ */ import_react.default.createElement("div", { style: styles.profileSection }, confirmDelete ? /* @__PURE__ */ import_react.default.createElement("div", { style: styles.profileDeleteConfirm }, /* @__PURE__ */ import_react.default.createElement("span", null, "Remove this regular? Their order history stays, just unlinked."), /* @__PURE__ */ import_react.default.createElement("div", { style: styles.regularFormActions }, /* @__PURE__ */ import_react.default.createElement("button", { style: styles.confirmNo, onClick: () => setConfirmDelete(false) }, "Cancel"), /* @__PURE__ */ import_react.default.createElement("button", { style: styles.confirmDeleteRed, onClick: () => onDelete(regular.id) }, "Remove"))) : /* @__PURE__ */ import_react.default.createElement("button", { style: styles.profileDeleteBtn, onClick: () => setConfirmDelete(true) }, /* @__PURE__ */ import_react.default.createElement(Trash2, { size: 13 }), " Remove regular")));
  }
  function WeekTab({ selected, onToggle }) {
    return /* @__PURE__ */ import_react.default.createElement("div", null, /* @__PURE__ */ import_react.default.createElement("div", { style: styles.genCard }, /* @__PURE__ */ import_react.default.createElement("div", { style: styles.genTitle }, "This week's dinner lineup"), /* @__PURE__ */ import_react.default.createElement("div", { style: styles.genHint }, "Check the dishes you're offering. The order picker, text parser, and shopping list follow this instantly. Existing orders aren't affected. The customer-facing PDF still comes from Claude \u2014 just tell it your picks (or send it a screenshot of this screen)."), selected.length === 0 && /* @__PURE__ */ import_react.default.createElement("div", { style: styles.parseError }, "No dishes selected \u2014 the Dinner section will be empty on new orders.")), ALL_DINNERS.map((dish) => {
      const isOn = selected.includes(dish.name);
      const prices = dish.variants.map((v) => v.price);
      const lo = Math.min(...prices);
      const hi = Math.max(...prices);
      const priceLabel = lo === hi ? currency(lo) : `${currency(lo)}\u2013${currency(hi)}`;
      return /* @__PURE__ */ import_react.default.createElement(
        "button",
        {
          key: dish.name,
          style: { ...styles.cookItem, ...isOn ? {} : { opacity: 0.55 } },
          onClick: () => onToggle(dish.name)
        },
        /* @__PURE__ */ import_react.default.createElement("div", { style: { ...styles.checkbox, ...isOn ? styles.checkboxChecked : {} } }, isOn && /* @__PURE__ */ import_react.default.createElement(Check, { size: 14, color: "#1a1a1a" })),
        /* @__PURE__ */ import_react.default.createElement("div", { style: styles.cookItemText }, /* @__PURE__ */ import_react.default.createElement("div", { style: styles.cookItemName }, dish.name), /* @__PURE__ */ import_react.default.createElement("div", { style: styles.cookItemVariant }, dish.variants.length, " option", dish.variants.length !== 1 ? "s" : "", " \xB7 ", priceLabel)),
        /* @__PURE__ */ import_react.default.createElement("div", { style: { ...styles.cookItemQty, color: isOn ? "#5DCAA5" : "#5F5E5A", fontSize: "11px", fontWeight: 700 } }, isOn ? "ON" : "OFF")
      );
    }));
  }
  function StatsBar({ stats }) {
    return /* @__PURE__ */ import_react.default.createElement("div", { style: styles.statsBar }, /* @__PURE__ */ import_react.default.createElement("div", { style: styles.statTile }, /* @__PURE__ */ import_react.default.createElement("div", { style: styles.statValue }, stats.active), /* @__PURE__ */ import_react.default.createElement("div", { style: styles.statLabel }, "Active")), /* @__PURE__ */ import_react.default.createElement("div", { style: styles.statTile }, /* @__PURE__ */ import_react.default.createElement("div", { style: styles.statValue }, currency(stats.booked)), /* @__PURE__ */ import_react.default.createElement("div", { style: styles.statLabel }, "This week")), /* @__PURE__ */ import_react.default.createElement("div", { style: styles.statTile }, /* @__PURE__ */ import_react.default.createElement("div", { style: { ...styles.statValue, ...stats.unpaid > 0 ? { color: "#EF9F27" } : {} } }, currency(stats.unpaid)), /* @__PURE__ */ import_react.default.createElement("div", { style: styles.statLabel }, "Unpaid")));
  }
  function QtyControl({ value, onChange, min = 0 }) {
    return /* @__PURE__ */ import_react.default.createElement("div", { style: styles.qtyControl, onClick: (e) => e.stopPropagation() }, /* @__PURE__ */ import_react.default.createElement("button", { style: styles.qtyBtn, onClick: () => onChange(Math.max(min, value - 1)), "aria-label": "Decrease" }, "\u2212"), /* @__PURE__ */ import_react.default.createElement("span", { style: styles.qtyValue }, value), /* @__PURE__ */ import_react.default.createElement("button", { style: styles.qtyBtn, onClick: () => onChange(value + 1), "aria-label": "Increase" }, "+"));
  }
  function parseFormRow(headerMap) {
    const items = [];
    const notes = [];
    const priceIndex = {};
    const addToIndex = (item) => {
      (item.variants || []).forEach((v) => {
        const key = Math.round(v.price * 100);
        if (!priceIndex[key]) priceIndex[key] = [];
        priceIndex[key].push({ name: item.name, label: v.label, price: v.price, cost: v.cost });
      });
    };
    ALL_DINNERS.forEach(addToIndex);
    Object.values(ALWAYS_MENU).flat().forEach(addToIndex);
    let customer = "";
    Object.entries(headerMap).forEach(([header, value]) => {
      const h = header.toLowerCase().trim();
      const v = String(value || "").trim();
      if (!v || v.toLowerCase() === "no thanks" || h.includes("timestamp")) return;
      if (h === "your name" || h.includes("your name")) {
        customer = v;
        return;
      }
      if (h.includes("notes") || h.includes("anything else") || h.includes("quantity") || h.includes("weight")) {
        if (v) notes.push(v);
        return;
      }
      const selections = v.includes(",") ? v.split(",").map((s) => s.trim()) : [v];
      selections.forEach((sel) => {
        if (!sel || sel.toLowerCase() === "no thanks") return;
        const priceMatch = sel.match(/[—–-]\s*\$(\d+(?:\.\d+)?)/);
        let matched = null;
        if (priceMatch) {
          const dollars = Math.round(parseFloat(priceMatch[1]) * 100);
          const candidates = priceIndex[dollars] || [];
          if (candidates.length === 1) {
            matched = candidates[0];
          } else if (candidates.length > 1) {
            const hNorm = h.replace(/[^a-z0-9]/g, "");
            matched = candidates.find((c) => {
              const cNorm = c.name.toLowerCase().replace(/[^a-z0-9]/g, "");
              return cNorm.includes(hNorm.slice(0, 8)) || hNorm.includes(cNorm.slice(0, 8));
            }) || candidates[0];
          }
        }
        if (!matched) {
          const selNorm = sel.toLowerCase().replace(/[^a-z0-9]/g, "");
          let bestScore = 0;
          [...ALL_DINNERS, ...Object.values(ALWAYS_MENU).flat()].forEach((item) => {
            (item.variants || []).forEach((variant) => {
              const combined = (item.name + " " + variant.label).toLowerCase().replace(/[^a-z0-9]/g, "");
              let score = 0;
              for (let i = 0; i < Math.min(selNorm.length, combined.length); i++) {
                if (selNorm[i] === combined[i]) score++;
              }
              if (score > bestScore) {
                bestScore = score;
                matched = { name: item.name, label: variant.label, price: variant.price, cost: variant.cost };
              }
            });
          });
        }
        if (matched) {
          items.push({
            name: matched.name,
            variant: matched.label,
            qty: 1,
            price: matched.price,
            cost: matched.cost || 0,
            note: "",
            hasPhoto: false
          });
        } else {
          notes.push("Unmatched item: " + sel);
        }
      });
    });
    return { customer: customer || "Unknown", items, notes: notes.join(" | ") };
  }
  async function fetchFormRows() {
    try {
      const res = await fetch(FORM_CSV_URL, { cache: "no-store" });
      if (!res.ok) return null;
      const text = await res.text();
      const rows = parseDelimited(text);
      if (rows.length < 2) return [];
      const headers = rows[0].map((h) => h.trim());
      return rows.slice(1).map((cells) => {
        const map = {};
        headers.forEach((h, i) => {
          map[h] = cells[i] || "";
        });
        return map;
      });
    } catch {
      return null;
    }
  }
  async function parseFormNotes(notes) {
    const prompt = 'You are a helper for a small meal prep chef reviewing customer order notes. The customer placed their order via a structured form (dropdowns), so the main items are already captured. These are their free-text notes: """' + notes + '""" Interpret these notes and return a JSON object with: "spice": any spice level request or null, "substitutions": any substitution requests as a string or null, "extras": any extra items or add-ons mentioned that were not in the form or null, "delivery": any delivery instructions or timing notes or null, "other": anything else worth flagging for the chef or null, "summary": a single short sentence summarizing what action the chef needs to take, or null if notes are routine. Return ONLY valid JSON, no markdown fences, no explanation.';
    try {
      const res = await fetch("https://ltb-proxy.strickland-kevinj.workers.dev/parse-notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model: "claude-sonnet-4-6", max_tokens: 500, messages: [{ role: "user", content: prompt }] })
      });
      const raw = await res.text();
      const data = JSON.parse(raw);
      const text = (data.content || []).map((b) => b.type === "text" ? b.text : "").join("");
      const clean = text.replace(/```json|```/g, "").trim();
      const jsonMatch = clean.match(/\{[\s\S]*\}/);
      return JSON.parse(jsonMatch ? jsonMatch[0] : clean);
    } catch {
      return null;
    }
  }
  function parseDelimited(text) {
    const rows = [];
    let row = [];
    let field = "";
    let inQuotes = false;
    const delim = text.includes("	") ? "	" : ",";
    for (let i = 0; i < text.length; i++) {
      const ch = text[i];
      if (inQuotes) {
        if (ch === '"') {
          if (text[i + 1] === '"') {
            field += '"';
            i++;
          } else inQuotes = false;
        } else field += ch;
      } else {
        if (ch === '"') inQuotes = true;
        else if (ch === delim) {
          row.push(field);
          field = "";
        } else if (ch === "\n") {
          row.push(field);
          rows.push(row);
          row = [];
          field = "";
        } else if (ch === "\r") {
        } else field += ch;
      }
    }
    if (field.length > 0 || row.length > 0) {
      row.push(field);
      rows.push(row);
    }
    return rows.filter((r) => r.some((c) => c.trim()));
  }
  function rowToOrderText(headerMap) {
    const parts = [];
    let customer = "";
    Object.entries(headerMap).forEach(([header, value]) => {
      const h = header.toLowerCase().trim();
      const v = String(value || "").trim();
      if (!v || v.toLowerCase() === "none") return;
      if (h.includes("timestamp")) return;
      if ((h === "name" || h.includes("your name")) && !customer) {
        customer = v;
        return;
      }
      parts.push(`${header}: ${v}`);
    });
    return { customer, text: parts.join("\n") };
  }
  function PasteOrderCard({ menu, onParsed, onCancel }) {
    const [text, setText] = (0, import_react.useState)("");
    const [imageFile, setImageFile] = (0, import_react.useState)(null);
    const [parsing, setParsing] = (0, import_react.useState)(false);
    const [parseError, setParseError] = (0, import_react.useState)(null);
    const canParse = !!text.trim() || !!imageFile;
    const onPickImage = (e) => {
      const file = e.target.files && e.target.files[0];
      if (file) setImageFile(file);
      e.target.value = "";
    };
    const parse = async () => {
      if (!canParse) return;
      setParsing(true);
      setParseError(null);
      let imageBase64 = null;
      if (imageFile) {
        try {
          imageBase64 = await fileToJpegBase64(imageFile);
        } catch (e) {
          setParseError("Couldn't read the photo file. If it's a photo from your camera roll (HEIC), try taking a screenshot of it and attaching that instead.");
          setParsing(false);
          return;
        }
      }
      try {
        const draft = await parseOrderText(text.trim(), imageBase64, menu);
        if (draft.items.length === 0 && !draft.notes) {
          setParseError("Couldn't find any menu items in that. Add the order manually?");
          setParsing(false);
          return;
        }
        onParsed(draft);
      } catch (e) {
        const msg = e && e.message || "";
        if (imageBase64 && msg.startsWith("Non-JSON response (HTTP 200)")) {
          setParseError("Claude's artifact platform doesn't support reading photos yet (text works fine). Type the circled items into the text box instead \u2014 the photo button will start working if Anthropic enables image support.");
        } else {
          const detail = msg ? ` (${msg})` : "";
          setParseError(`Couldn't process that${detail}. Try again, or add the order manually.`);
        }
        setParsing(false);
      }
    };
    return /* @__PURE__ */ import_react.default.createElement("div", { style: styles.formCard }, /* @__PURE__ */ import_react.default.createElement("div", { style: styles.formHeader }, /* @__PURE__ */ import_react.default.createElement("div", { style: styles.formTitle }, "Paste a customer order"), /* @__PURE__ */ import_react.default.createElement("button", { style: styles.iconBtn, onClick: onCancel, "aria-label": "Cancel" }, /* @__PURE__ */ import_react.default.createElement(X, { size: 18 }))), /* @__PURE__ */ import_react.default.createElement("div", { style: styles.pasteHint }, "Paste their text and I'll match it to the current menu and pre-fill the order \u2014 you just add their name and double-check. Items from an old menu get flagged in notes instead of guessed. (Photo reading is built in but waiting on platform support \u2014 text is the reliable path.)"), /* @__PURE__ */ import_react.default.createElement(
      "textarea",
      {
        style: { ...styles.textarea, minHeight: "90px" },
        placeholder: 'e.g. "Hey! Can I get a large mushroom noodles, 2 quesos (will return one jar), and a pineapple?"',
        value: text,
        onChange: (e) => setText(e.target.value)
      }
    ), /* @__PURE__ */ import_react.default.createElement("div", { style: styles.attachRow }, /* @__PURE__ */ import_react.default.createElement("label", { style: styles.attachBtn }, /* @__PURE__ */ import_react.default.createElement(ImageIcon, { size: 15 }), imageFile ? "Change photo" : "Attach a photo", /* @__PURE__ */ import_react.default.createElement("input", { type: "file", accept: "image/*", onChange: onPickImage, style: { display: "none" } })), imageFile && /* @__PURE__ */ import_react.default.createElement("div", { style: styles.attachChip }, /* @__PURE__ */ import_react.default.createElement("span", { style: styles.attachName }, imageFile.name || "photo"), /* @__PURE__ */ import_react.default.createElement("button", { style: styles.iconBtn, onClick: () => setImageFile(null), "aria-label": "Remove photo" }, /* @__PURE__ */ import_react.default.createElement(X, { size: 14 })))), parseError && /* @__PURE__ */ import_react.default.createElement("div", { style: styles.parseError }, parseError), /* @__PURE__ */ import_react.default.createElement(
      "button",
      {
        style: { ...styles.saveBtn, ...!canParse || parsing ? styles.saveBtnDisabled : {} },
        onClick: parse,
        disabled: !canParse || parsing
      },
      parsing ? imageFile ? "Reading the photo..." : "Reading order..." : "Build the order"
    ));
  }
  function AmendOrderCard({ menu, orders, onAmended, onCancel }) {
    const [selectedId, setSelectedId] = (0, import_react.useState)(orders.length === 1 ? orders[0].id : "");
    const [text, setText] = (0, import_react.useState)("");
    const [parsing, setParsing] = (0, import_react.useState)(false);
    const [parseError, setParseError] = (0, import_react.useState)(null);
    const selectedOrder = orders.find((o) => o.id === selectedId) || null;
    const canParse = !!selectedOrder && !!text.trim();
    const parse = async () => {
      if (!canParse) return;
      setParsing(true);
      setParseError(null);
      try {
        const draft = await parseAmendment(selectedOrder, text.trim(), menu);
        if (draft.items.length === 0) {
          setParseError("That left the order with no items. If you meant to clear it, edit the order directly instead.");
          setParsing(false);
          return;
        }
        onAmended(draft);
      } catch (e) {
        const msg = e && e.message || "";
        const detail = msg ? ` (${msg})` : "";
        setParseError(`Couldn't process that change${detail}. Try again, or edit the order directly.`);
        setParsing(false);
      }
    };
    return /* @__PURE__ */ import_react.default.createElement("div", { style: styles.formCard }, /* @__PURE__ */ import_react.default.createElement("div", { style: styles.formHeader }, /* @__PURE__ */ import_react.default.createElement("div", { style: styles.formTitle }, "Amend an order via text"), /* @__PURE__ */ import_react.default.createElement("button", { style: styles.iconBtn, onClick: onCancel, "aria-label": "Cancel" }, /* @__PURE__ */ import_react.default.createElement(X, { size: 18 }))), orders.length === 0 ? /* @__PURE__ */ import_react.default.createElement("div", { style: styles.pasteHint }, "No active orders to amend yet.") : /* @__PURE__ */ import_react.default.createElement(import_react.default.Fragment, null, /* @__PURE__ */ import_react.default.createElement("div", { style: styles.pasteHint }, "Pick the customer's order, paste their follow-up message, and I'll apply the change and open the updated order for you to review before saving."), /* @__PURE__ */ import_react.default.createElement("label", { style: styles.label }, "Which order?"), /* @__PURE__ */ import_react.default.createElement("div", { style: styles.amendOrderPicker }, orders.map((o) => /* @__PURE__ */ import_react.default.createElement(
      "button",
      {
        key: o.id,
        style: { ...styles.amendOrderChip, ...selectedId === o.id ? styles.amendOrderChipActive : {} },
        onClick: () => setSelectedId(o.id)
      },
      /* @__PURE__ */ import_react.default.createElement("span", { style: styles.amendChipName }, o.customer),
      /* @__PURE__ */ import_react.default.createElement("span", { style: styles.amendChipMeta }, (o.items || []).reduce((s, it) => s + it.qty, 0), " items \xB7 ", currency(o.total))
    ))), selectedOrder && /* @__PURE__ */ import_react.default.createElement("div", { style: styles.amendCurrentBox }, /* @__PURE__ */ import_react.default.createElement("div", { style: styles.amendCurrentTitle }, "Current order:"), (selectedOrder.items || []).map((it, i) => /* @__PURE__ */ import_react.default.createElement("div", { key: i, style: styles.amendCurrentItem }, it.qty, "\xD7 ", it.name, " ", /* @__PURE__ */ import_react.default.createElement("span", { style: styles.orderItemVariant }, "(", isPerLbItem(it.name) && it.weight > 0 ? `${it.weight} lb` : it.variant, ")")))), /* @__PURE__ */ import_react.default.createElement("label", { style: styles.label }, "Their follow-up message"), /* @__PURE__ */ import_react.default.createElement(
      "textarea",
      {
        style: { ...styles.textarea, minHeight: "80px" },
        placeholder: 'e.g. "Actually can you make the curry large, and add a dozen cookies?"',
        value: text,
        onChange: (e) => setText(e.target.value)
      }
    ), parseError && /* @__PURE__ */ import_react.default.createElement("div", { style: styles.parseError }, parseError), /* @__PURE__ */ import_react.default.createElement(
      "button",
      {
        style: { ...styles.saveBtn, ...!canParse || parsing ? styles.saveBtnDisabled : {} },
        onClick: parse,
        disabled: !canParse || parsing
      },
      parsing ? "Applying the change..." : "Apply change"
    )));
  }
  function CsvImportCard({ menu, onImport, onCancel }) {
    const [text, setText] = (0, import_react.useState)("");
    const [parsing, setParsing] = (0, import_react.useState)(false);
    const [progress, setProgress] = (0, import_react.useState)(null);
    const [results, setResults] = (0, import_react.useState)(null);
    const [parseError, setParseError] = (0, import_react.useState)(null);
    const run = async () => {
      setParseError(null);
      const rows = parseDelimited(text);
      if (rows.length < 2) {
        setParseError("Need a header row plus at least one order row. Copy the rows from your Sheet including the header.");
        return;
      }
      const headers = rows[0].map((h) => h.trim());
      const dataRows = rows.slice(1);
      setParsing(true);
      setProgress({ done: 0, total: dataRows.length });
      const out = [];
      for (let r = 0; r < dataRows.length; r++) {
        const cells = dataRows[r];
        const headerMap = {};
        headers.forEach((h, i) => {
          headerMap[h] = cells[i] || "";
        });
        const { customer, text: orderText } = rowToOrderText(headerMap);
        if (!orderText.trim()) {
          setProgress({ done: r + 1, total: dataRows.length });
          continue;
        }
        try {
          const parsed = await parseOrderText(orderText, null, menu);
          out.push({
            customer: customer || `Row ${r + 1}`,
            order: { ...parsed, customer: customer || `Row ${r + 1}` },
            error: null
          });
        } catch (e) {
          out.push({
            customer: customer || `Row ${r + 1}`,
            order: null,
            error: e && e.message || "parse failed"
          });
        }
        setProgress({ done: r + 1, total: dataRows.length });
      }
      setResults(out);
      setParsing(false);
    };
    const importAll = () => {
      const good = results.filter((r) => r.order && r.order.items.length > 0);
      onImport(good.map((r) => r.order));
    };
    const goodCount = results ? results.filter((r) => r.order && r.order.items.length > 0).length : 0;
    return /* @__PURE__ */ import_react.default.createElement("div", { style: styles.formCard }, /* @__PURE__ */ import_react.default.createElement("div", { style: styles.formHeader }, /* @__PURE__ */ import_react.default.createElement("div", { style: styles.formTitle }, "Import from Google Sheet"), /* @__PURE__ */ import_react.default.createElement("button", { style: styles.iconBtn, onClick: onCancel, "aria-label": "Cancel" }, /* @__PURE__ */ import_react.default.createElement(X, { size: 18 }))), !results ? /* @__PURE__ */ import_react.default.createElement(import_react.default.Fragment, null, /* @__PURE__ */ import_react.default.createElement("div", { style: styles.pasteHint }, "In your Google Sheet, select the order rows ", /* @__PURE__ */ import_react.default.createElement("strong", null, "including the header row"), ", copy, and paste below. Each row becomes an order you can review before saving."), /* @__PURE__ */ import_react.default.createElement(
      "textarea",
      {
        style: { ...styles.textarea, minHeight: "120px", fontSize: "12px" },
        placeholder: "Paste your copied spreadsheet rows here...",
        value: text,
        onChange: (e) => setText(e.target.value)
      }
    ), parseError && /* @__PURE__ */ import_react.default.createElement("div", { style: styles.parseError }, parseError), parsing && progress && /* @__PURE__ */ import_react.default.createElement("div", { style: styles.csvProgress }, "Reading orders... ", progress.done, "/", progress.total), /* @__PURE__ */ import_react.default.createElement(
      "button",
      {
        style: { ...styles.saveBtn, ...!text.trim() || parsing ? styles.saveBtnDisabled : {} },
        onClick: run,
        disabled: !text.trim() || parsing
      },
      parsing ? "Reading..." : "Read orders"
    )) : /* @__PURE__ */ import_react.default.createElement(import_react.default.Fragment, null, /* @__PURE__ */ import_react.default.createElement("div", { style: styles.pasteHint }, goodCount, " order", goodCount !== 1 ? "s" : "", " ready to import", results.length - goodCount > 0 ? `, ${results.length - goodCount} with issues` : "", "."), /* @__PURE__ */ import_react.default.createElement("div", { style: styles.csvResultsList }, results.map((r, i) => /* @__PURE__ */ import_react.default.createElement("div", { key: i, style: styles.csvResultRow }, /* @__PURE__ */ import_react.default.createElement("div", { style: styles.csvResultName }, r.customer), r.order && r.order.items.length > 0 ? /* @__PURE__ */ import_react.default.createElement("div", { style: styles.csvResultItems }, r.order.items.map((it, j) => /* @__PURE__ */ import_react.default.createElement("span", { key: j, style: styles.csvResultItem }, it.qty, "\xD7 ", it.name, j < r.order.items.length - 1 ? "," : "")), r.order.reviewReasons && r.order.reviewReasons.length > 0 && /* @__PURE__ */ import_react.default.createElement("span", { style: styles.csvResultFlag }, " \xB7 ", r.order.reviewReasons.length, " to review")) : /* @__PURE__ */ import_react.default.createElement("div", { style: styles.csvResultError }, r.error ? "Could not read this row" : "No items matched")))), /* @__PURE__ */ import_react.default.createElement(
      "button",
      {
        style: { ...styles.saveBtn, ...goodCount === 0 ? styles.saveBtnDisabled : {} },
        onClick: importAll,
        disabled: goodCount === 0
      },
      "Import ",
      goodCount,
      " order",
      goodCount !== 1 ? "s" : ""
    ), /* @__PURE__ */ import_react.default.createElement("button", { style: styles.csvBackBtn, onClick: () => {
      setResults(null);
      setText("");
    } }, "Start over")));
  }
  function ReviewModal({ reasons, items, onApplyNote, onApplyUpcharge, onApplyWeight, onAddCustomCharge, onResolve, onClose }) {
    const [idx, setIdx] = (0, import_react.useState)(0);
    const [resolved, setResolved] = (0, import_react.useState)({});
    const total = reasons.length;
    const allDone = Object.keys(resolved).length >= total;
    const matchItem = (reason2) => {
      const lower = reason2.toLowerCase();
      let best = -1;
      items.forEach((it, i) => {
        if (lower.includes(it.name.toLowerCase())) best = i;
      });
      return best;
    };
    const reason = reasons[idx];
    const itemIdx = reason ? matchItem(reason) : -1;
    const item = itemIdx >= 0 ? items[itemIdx] : null;
    const [noteInput, setNoteInput] = (0, import_react.useState)("");
    const [upLabel, setUpLabel] = (0, import_react.useState)("");
    const [upAmount, setUpAmount] = (0, import_react.useState)("");
    const [weightInput, setWeightInput] = (0, import_react.useState)("");
    const [chargeLabel, setChargeLabel] = (0, import_react.useState)("");
    const [chargeAmount, setChargeAmount] = (0, import_react.useState)("");
    (0, import_react.useEffect)(() => {
      setNoteInput(item?.note || "");
      setUpLabel(item?.upcharge?.label || "");
      setUpAmount(item?.upcharge?.amount ? String(item.upcharge.amount) : "");
      setWeightInput(item?.weight ? String(item.weight) : "");
      setChargeLabel("");
      setChargeAmount("");
    }, [idx]);
    const markResolved = () => {
      setResolved((prev) => ({ ...prev, [idx]: true }));
      onResolve(idx);
      const next = reasons.findIndex((_, i) => i !== idx && !resolved[i]);
      if (next >= 0) setIdx(next);
    };
    const isWeightReason = /weight/i.test(reason || "");
    const isUpchargeReason = /price for|upcharge/i.test(reason || "");
    const isMatchReason = /match|menu/i.test(reason || "");
    return /* @__PURE__ */ import_react.default.createElement("div", { style: styles.invoiceOverlay, onClick: onClose }, /* @__PURE__ */ import_react.default.createElement("div", { style: styles.reviewModalCard, onClick: (e) => e.stopPropagation() }, /* @__PURE__ */ import_react.default.createElement("div", { style: styles.reviewModalHeader }, /* @__PURE__ */ import_react.default.createElement("div", { style: styles.reviewModalTitle }, "Let's sort this out"), /* @__PURE__ */ import_react.default.createElement("button", { style: styles.iconBtn, onClick: onClose, "aria-label": "Close" }, /* @__PURE__ */ import_react.default.createElement(X, { size: 18 }))), /* @__PURE__ */ import_react.default.createElement("div", { style: styles.reviewProgress }, Object.keys(resolved).length, " of ", total, " handled"), !allDone && reason && /* @__PURE__ */ import_react.default.createElement("div", { style: styles.reviewStep }, /* @__PURE__ */ import_react.default.createElement("div", { style: styles.reviewReasonBox }, reason), item && /* @__PURE__ */ import_react.default.createElement("div", { style: styles.reviewItemContext }, "On: ", /* @__PURE__ */ import_react.default.createElement("strong", null, item.qty, "\xD7 ", item.name), " (", item.variant, ")"), isWeightReason && item && /* @__PURE__ */ import_react.default.createElement("div", { style: styles.reviewField }, /* @__PURE__ */ import_react.default.createElement("label", { style: styles.miniLabel }, "How many pounds? (", currency(PER_LB_ITEMS[item.name]?.pricePerLb || 0), "/lb + $1.50 bag)"), /* @__PURE__ */ import_react.default.createElement(
      "input",
      {
        style: styles.input,
        type: "number",
        inputMode: "decimal",
        placeholder: "e.g. 0.5",
        value: weightInput,
        onChange: (e) => setWeightInput(e.target.value),
        autoFocus: true
      }
    ), /* @__PURE__ */ import_react.default.createElement(
      "button",
      {
        style: { ...styles.doneItemBtn, marginTop: "8px", alignSelf: "flex-start", ...parseFloat(weightInput) > 0 ? {} : styles.saveBtnDisabled },
        disabled: !(parseFloat(weightInput) > 0),
        onClick: () => {
          onApplyWeight(itemIdx, weightInput);
          markResolved();
        }
      },
      "Set weight & price"
    )), isUpchargeReason && item && /* @__PURE__ */ import_react.default.createElement("div", { style: styles.reviewField }, /* @__PURE__ */ import_react.default.createElement("label", { style: styles.miniLabel }, "What should this cost?"), /* @__PURE__ */ import_react.default.createElement("div", { style: styles.upchargeRow }, /* @__PURE__ */ import_react.default.createElement(
      "input",
      {
        style: { ...styles.input, flex: 2, marginTop: 0 },
        placeholder: "label",
        value: upLabel,
        onChange: (e) => setUpLabel(e.target.value)
      }
    ), /* @__PURE__ */ import_react.default.createElement(
      "input",
      {
        style: { ...styles.input, flex: 1, marginTop: 0 },
        type: "number",
        inputMode: "decimal",
        placeholder: "$",
        value: upAmount,
        onChange: (e) => setUpAmount(e.target.value),
        autoFocus: true
      }
    )), /* @__PURE__ */ import_react.default.createElement(
      "button",
      {
        style: { ...styles.doneItemBtn, marginTop: "8px", alignSelf: "flex-start", ...parseFloat(upAmount) > 0 ? {} : styles.saveBtnDisabled },
        disabled: !(parseFloat(upAmount) > 0),
        onClick: () => {
          onApplyUpcharge(itemIdx, upLabel || "Upcharge", upAmount);
          markResolved();
        }
      },
      "Set upcharge"
    )), !isWeightReason && !isUpchargeReason && /* @__PURE__ */ import_react.default.createElement("div", { style: styles.reviewField }, item && /* @__PURE__ */ import_react.default.createElement(import_react.default.Fragment, null, /* @__PURE__ */ import_react.default.createElement("label", { style: styles.miniLabel }, "Add a note to this item"), /* @__PURE__ */ import_react.default.createElement(
      "input",
      {
        style: styles.input,
        placeholder: "e.g. chili oil on the side",
        value: noteInput,
        onChange: (e) => setNoteInput(e.target.value)
      }
    ), /* @__PURE__ */ import_react.default.createElement(
      "button",
      {
        style: { ...styles.reviewActionBtn, ...noteInput.trim() ? {} : styles.saveBtnDisabled },
        disabled: !noteInput.trim(),
        onClick: () => {
          onApplyNote(itemIdx, noteInput.trim());
          markResolved();
        }
      },
      "Add note & resolve"
    ), /* @__PURE__ */ import_react.default.createElement("div", { style: styles.reviewOr }, "or")), /* @__PURE__ */ import_react.default.createElement("label", { style: styles.miniLabel }, "Add a custom charge for this request"), /* @__PURE__ */ import_react.default.createElement("div", { style: styles.upchargeRow }, /* @__PURE__ */ import_react.default.createElement(
      "input",
      {
        style: { ...styles.input, flex: 2, marginTop: 0 },
        placeholder: "what for?",
        value: chargeLabel,
        onChange: (e) => setChargeLabel(e.target.value)
      }
    ), /* @__PURE__ */ import_react.default.createElement(
      "input",
      {
        style: { ...styles.input, flex: 1, marginTop: 0 },
        type: "number",
        inputMode: "decimal",
        placeholder: "$",
        value: chargeAmount,
        onChange: (e) => setChargeAmount(e.target.value)
      }
    )), /* @__PURE__ */ import_react.default.createElement(
      "button",
      {
        style: { ...styles.reviewActionBtn, ...chargeLabel.trim() && parseFloat(chargeAmount) > 0 ? {} : styles.saveBtnDisabled },
        disabled: !(chargeLabel.trim() && parseFloat(chargeAmount) > 0),
        onClick: () => {
          onAddCustomCharge(chargeLabel.trim(), parseFloat(chargeAmount));
          markResolved();
        }
      },
      "Add charge & resolve"
    )), /* @__PURE__ */ import_react.default.createElement("button", { style: styles.reviewSkipBtn, onClick: markResolved }, "Nothing needed, mark handled"), total > 1 && /* @__PURE__ */ import_react.default.createElement("div", { style: styles.reviewNav }, reasons.map((_, i) => /* @__PURE__ */ import_react.default.createElement(
      "button",
      {
        key: i,
        style: {
          ...styles.reviewDot,
          ...i === idx ? styles.reviewDotActive : {},
          ...resolved[i] ? styles.reviewDotDone : {}
        },
        onClick: () => setIdx(i),
        "aria-label": `Item ${i + 1}`
      }
    )))), allDone && /* @__PURE__ */ import_react.default.createElement("div", { style: styles.reviewDone }, /* @__PURE__ */ import_react.default.createElement(Check, { size: 28, color: "#1D9E75" }), /* @__PURE__ */ import_react.default.createElement("div", { style: styles.reviewDoneText }, "All sorted. You're good to save."), /* @__PURE__ */ import_react.default.createElement("button", { style: styles.doneItemBtn, onClick: onClose }, "Back to order"))));
  }
  function OrderForm({ menu, initial, recentCustomers, onSave, onCancel }) {
    const isEdit = !!initial?.id;
    const [customer, setCustomer] = (0, import_react.useState)(initial?.customer || "");
    const [items, setItems] = (0, import_react.useState)(initial?.items || []);
    const [jarSwaps, setJarSwaps] = (0, import_react.useState)(initial?.jarSwaps || 0);
    const [containerReturns, setContainerReturns] = (0, import_react.useState)(initial?.containerReturns || 0);
    const [notes, setNotes] = (0, import_react.useState)(initial?.notes || "");
    const [discountType, setDiscountType] = (0, import_react.useState)(initial?.discountType || null);
    const [discountValue, setDiscountValue] = (0, import_react.useState)(initial?.discountValue ? String(initial.discountValue) : "");
    const [customCharges, setCustomCharges] = (0, import_react.useState)(initial?.customCharges || []);
    const [waiveSurcharge, setWaiveSurcharge] = (0, import_react.useState)(!!initial?.waiveSurcharge);
    const [pickerCategory, setPickerCategory] = (0, import_react.useState)(null);
    const [reviewReasons, setReviewReasons] = (0, import_react.useState)(initial?.reviewReasons || []);
    const [expandedItem, setExpandedItem] = (0, import_react.useState)(null);
    const [showReview, setShowReview] = (0, import_react.useState)(false);
    const discNum = parseFloat(discountValue) || 0;
    const itemsTotal = itemsBaseTotal(items);
    const disc = discountAmount(itemsTotal, discountType, discNum);
    const total = orderTotal(items, jarSwaps, containerReturns, discountType, discNum, customCharges, waiveSurcharge);
    const itemCount = items.reduce((s, it) => s + it.qty, 0);
    const findItemIndex = (category, name, variant) => items.findIndex((i) => i.category === category && i.name === name && i.variant === variant.label);
    const addItem = (category, name, variant) => {
      const base = { category, name, variant: variant.label, price: variant.price, cost: variant.cost, qty: 1, note: "", upcharge: null };
      if (isPerLbItem(name)) {
        base.weightPending = true;
        base.price = 0;
        base.cost = 0;
      }
      setItems((prev) => [...prev, base]);
    };
    const setQty = (idx, qty) => {
      setItems((prev) => {
        const next = [...prev];
        if (qty <= 0) next.splice(idx, 1);
        else next[idx] = { ...next[idx], qty };
        return next;
      });
    };
    const setItemNote = (idx, note) => {
      setItems((prev) => prev.map((it, i) => i === idx ? { ...it, note } : it));
    };
    const setItemUpcharge = (idx, label, amount) => {
      setItems((prev) => prev.map((it, i) => {
        if (i !== idx) return it;
        if (!label && !amount) return { ...it, upcharge: null };
        return { ...it, upcharge: { label: label || "Upcharge", amount: parseFloat(amount) || 0 } };
      }));
    };
    const setItemWeight = (idx, weightStr) => {
      setItems((prev) => prev.map((it, i) => {
        if (i !== idx) return it;
        const w = parseFloat(weightStr);
        const updated = { ...it, weight: w > 0 ? w : void 0 };
        return isPerLbItem(it.name) && w > 0 ? repricePerLbItem(updated) : updated;
      }));
    };
    const hasPerLbItems = items.some((it) => isPerLbItem(it.name));
    const repriceAllSousVide = () => {
      setItems((prev) => prev.map((it) => isPerLbItem(it.name) ? repricePerLbItem(it) : it));
    };
    const addCustomCharge = () => setCustomCharges((prev) => [...prev, { id: uid(), label: "", amount: "" }]);
    const updateCustomCharge = (id, field, val) => setCustomCharges((prev) => prev.map((ch) => ch.id === id ? { ...ch, [field]: val } : ch));
    const removeCustomCharge = (id) => setCustomCharges((prev) => prev.filter((ch) => ch.id !== id));
    const dismissReview = (i) => setReviewReasons((prev) => prev.filter((_, idx) => idx !== i));
    const save = () => {
      if (!customer.trim() || items.length === 0) return;
      const cleanCharges = customCharges.map((ch) => ({ id: ch.id, label: (ch.label || "").trim(), amount: parseFloat(ch.amount) || 0 })).filter((ch) => ch.label && ch.amount);
      onSave({
        id: initial?.id || uid(),
        customer: customer.trim(),
        items,
        jarSwaps,
        containerReturns,
        notes: notes.trim(),
        discountType: discNum > 0 ? discountType : null,
        discountValue: discNum > 0 ? discNum : 0,
        customCharges: cleanCharges,
        waiveSurcharge,
        total: orderTotal(items, jarSwaps, containerReturns, discountType, discNum, cleanCharges, waiveSurcharge),
        status: initial?.status || "Ordered",
        paid: initial?.paid || false,
        archived: initial?.archived || false,
        createdAt: initial?.createdAt || (/* @__PURE__ */ new Date()).toISOString()
      });
    };
    const showChips = !isEdit && !customer.trim() && recentCustomers.length > 0;
    const selectedByCategory = (0, import_react.useMemo)(() => {
      const counts = {};
      items.forEach((it) => {
        counts[it.category] = (counts[it.category] || 0) + it.qty;
      });
      return counts;
    }, [items]);
    return /* @__PURE__ */ import_react.default.createElement("div", { style: styles.formCard }, /* @__PURE__ */ import_react.default.createElement("div", { style: styles.formHeader }, /* @__PURE__ */ import_react.default.createElement("div", { style: styles.formTitle }, isEdit ? `Edit order \u2014 ${initial.customer}` : "New order"), /* @__PURE__ */ import_react.default.createElement("button", { style: styles.iconBtn, onClick: onCancel, "aria-label": "Cancel" }, /* @__PURE__ */ import_react.default.createElement(X, { size: 18 }))), reviewReasons.length > 0 && /* @__PURE__ */ import_react.default.createElement("button", { style: styles.reviewOpenBtn, onClick: () => setShowReview(true) }, /* @__PURE__ */ import_react.default.createElement(AlertTriangle, { size: 16 }), /* @__PURE__ */ import_react.default.createElement("div", { style: styles.reviewOpenText }, /* @__PURE__ */ import_react.default.createElement("div", { style: styles.reviewOpenTitle }, reviewReasons.length, " thing", reviewReasons.length !== 1 ? "s" : "", " to sort out"), /* @__PURE__ */ import_react.default.createElement("div", { style: styles.reviewOpenSub }, "Tap to work through them")), /* @__PURE__ */ import_react.default.createElement(ChevronDown, { size: 16, style: { transform: "rotate(-90deg)" } })), showReview && /* @__PURE__ */ import_react.default.createElement(
      ReviewModal,
      {
        reasons: reviewReasons,
        items,
        onApplyNote: setItemNote,
        onApplyUpcharge: setItemUpcharge,
        onApplyWeight: setItemWeight,
        onAddCustomCharge: (label, amount) => setCustomCharges((prev) => [...prev, { id: uid(), label, amount: String(amount) }]),
        onResolve: (i) => dismissReview(i),
        onClose: () => setShowReview(false)
      }
    ), /* @__PURE__ */ import_react.default.createElement("label", { style: styles.label }, "Customer"), /* @__PURE__ */ import_react.default.createElement(
      "input",
      {
        style: styles.input,
        placeholder: "Who's this for?",
        value: customer,
        onChange: (e) => setCustomer(e.target.value),
        autoFocus: !isEdit && items.length > 0
      }
    ), showChips && /* @__PURE__ */ import_react.default.createElement("div", { style: styles.chipRow }, recentCustomers.map((name) => /* @__PURE__ */ import_react.default.createElement("button", { key: name, style: styles.chip, onClick: () => setCustomer(name) }, name))), /* @__PURE__ */ import_react.default.createElement("label", { style: styles.label }, "Items"), itemCount > 0 && /* @__PURE__ */ import_react.default.createElement("div", { style: styles.selectedSummary }, itemCount, " item", itemCount !== 1 ? "s" : "", " selected \xB7 ", currency(itemsTotal)), /* @__PURE__ */ import_react.default.createElement("div", { style: styles.categoryGrid }, Object.keys(menu).map((cat) => /* @__PURE__ */ import_react.default.createElement(
      "button",
      {
        key: cat,
        style: {
          ...styles.categoryBtn,
          ...pickerCategory === cat ? styles.categoryBtnActive : {}
        },
        onClick: () => setPickerCategory(pickerCategory === cat ? null : cat)
      },
      CATEGORY_LABELS[cat],
      selectedByCategory[cat] > 0 && /* @__PURE__ */ import_react.default.createElement("span", { style: styles.catCount }, selectedByCategory[cat]),
      pickerCategory === cat ? /* @__PURE__ */ import_react.default.createElement(ChevronUp, { size: 16 }) : /* @__PURE__ */ import_react.default.createElement(ChevronDown, { size: 16 })
    ))), pickerCategory && /* @__PURE__ */ import_react.default.createElement("div", { style: styles.picker }, menu[pickerCategory].map((menuItem) => /* @__PURE__ */ import_react.default.createElement("div", { key: menuItem.name, style: styles.pickerGroup }, /* @__PURE__ */ import_react.default.createElement("div", { style: styles.pickerGroupName }, menuItem.name), /* @__PURE__ */ import_react.default.createElement("div", { style: styles.pickerVariants }, menuItem.variants.map((variant) => {
      const idx = findItemIndex(pickerCategory, menuItem.name, variant);
      const selected = idx >= 0;
      return /* @__PURE__ */ import_react.default.createElement(
        "div",
        {
          key: variant.label,
          style: { ...styles.variantBtn, ...selected ? styles.variantBtnSelected : {} },
          onClick: () => !selected && addItem(pickerCategory, menuItem.name, variant),
          role: "button",
          tabIndex: 0
        },
        /* @__PURE__ */ import_react.default.createElement("span", { style: styles.variantLabel }, variant.label),
        selected ? /* @__PURE__ */ import_react.default.createElement(QtyControl, { value: items[idx].qty, onChange: (q) => setQty(idx, q) }) : /* @__PURE__ */ import_react.default.createElement("span", { style: styles.variantPrice }, currency(variant.price))
      );
    }))))), items.length > 0 && /* @__PURE__ */ import_react.default.createElement("div", { style: styles.reviewList }, items.map((it, idx) => {
      const open = expandedItem === idx;
      const hasExtra = it.note || it.upcharge && typeof it.upcharge === "object" && (it.upcharge.label || it.upcharge.amount);
      return /* @__PURE__ */ import_react.default.createElement("div", { key: `${it.category}-${it.name}-${it.variant}-${idx}`, style: styles.reviewItemCard }, /* @__PURE__ */ import_react.default.createElement("div", { style: styles.reviewRow }, /* @__PURE__ */ import_react.default.createElement(
        "button",
        {
          style: styles.reviewItemMain,
          onClick: () => setExpandedItem(open ? null : idx)
        },
        /* @__PURE__ */ import_react.default.createElement("span", { style: styles.reviewText }, it.qty, "\xD7 ", it.name, " ", /* @__PURE__ */ import_react.default.createElement("span", { style: styles.orderItemVariant }, "(", it.variant, ")")),
        hasExtra && /* @__PURE__ */ import_react.default.createElement("span", { style: styles.itemExtraDot })
      ), /* @__PURE__ */ import_react.default.createElement(QtyControl, { value: it.qty, onChange: (q) => setQty(idx, q) })), !open && isPerLbItem(it.name) && (it.weight > 0 ? /* @__PURE__ */ import_react.default.createElement("div", { style: styles.itemUpchargePreview }, it.weight, " lb \xB7 ", currency(it.price)) : /* @__PURE__ */ import_react.default.createElement("div", { style: styles.itemUpchargeNeedsPrice }, "set weight \u2304")), !open && it.note && /* @__PURE__ */ import_react.default.createElement("div", { style: styles.itemNotePreview }, "\u201C", it.note, "\u201D"), !open && it.upcharge && typeof it.upcharge === "object" && it.upcharge.amount > 0 ? /* @__PURE__ */ import_react.default.createElement("div", { style: styles.itemUpchargePreview }, "+ ", it.upcharge.label, " (", currency(it.upcharge.amount), ")") : null, !open && it.upcharge && typeof it.upcharge === "object" && it.upcharge.label && !it.upcharge.amount ? /* @__PURE__ */ import_react.default.createElement("div", { style: styles.itemUpchargeNeedsPrice }, "+ ", it.upcharge.label, " \u2014 set a price \u2304") : null, open && /* @__PURE__ */ import_react.default.createElement("div", { style: styles.itemEditor }, isPerLbItem(it.name) && /* @__PURE__ */ import_react.default.createElement("div", { style: styles.weightDeferNote }, "Priced by weight (", currency(PER_LB_ITEMS[it.name].pricePerLb), "/lb + $1.50 bag). Set the actual weight from the order after you've weighed it."), /* @__PURE__ */ import_react.default.createElement("label", { style: styles.miniLabel }, "Note for this item"), /* @__PURE__ */ import_react.default.createElement(
        "input",
        {
          style: styles.input,
          placeholder: "e.g. chili oil on the side",
          value: it.note || "",
          onChange: (e) => setItemNote(idx, e.target.value)
        }
      ), /* @__PURE__ */ import_react.default.createElement("label", { style: styles.miniLabel }, "Upcharge (optional)"), /* @__PURE__ */ import_react.default.createElement("div", { style: styles.upchargeRow }, /* @__PURE__ */ import_react.default.createElement(
        "input",
        {
          style: { ...styles.input, flex: 2, marginTop: 0 },
          placeholder: "label, e.g. extra protein",
          value: it.upcharge?.label || "",
          onChange: (e) => setItemUpcharge(idx, e.target.value, it.upcharge?.amount || "")
        }
      ), /* @__PURE__ */ import_react.default.createElement(
        "input",
        {
          style: { ...styles.input, flex: 1, marginTop: 0 },
          type: "number",
          inputMode: "decimal",
          placeholder: "$",
          value: it.upcharge?.amount || "",
          onChange: (e) => setItemUpcharge(idx, it.upcharge?.label || "Upcharge", e.target.value)
        }
      )), /* @__PURE__ */ import_react.default.createElement("div", { style: styles.itemEditorActions }, hasExtra && /* @__PURE__ */ import_react.default.createElement(
        "button",
        {
          style: styles.clearItemExtra,
          onClick: () => {
            setItemNote(idx, "");
            setItemUpcharge(idx, "", "");
          }
        },
        "Clear"
      ), /* @__PURE__ */ import_react.default.createElement("button", { style: styles.doneItemBtn, onClick: () => setExpandedItem(null) }, "Done"))));
    })), /* @__PURE__ */ import_react.default.createElement("div", { style: styles.loopRow }, /* @__PURE__ */ import_react.default.createElement("div", { style: styles.loopField }, /* @__PURE__ */ import_react.default.createElement("label", { style: styles.label }, "Jar swaps"), /* @__PURE__ */ import_react.default.createElement(QtyControl, { value: jarSwaps, onChange: setJarSwaps }), /* @__PURE__ */ import_react.default.createElement("div", { style: styles.loopHint }, "\u2212$2.00 each")), /* @__PURE__ */ import_react.default.createElement("div", { style: styles.loopField }, /* @__PURE__ */ import_react.default.createElement("label", { style: styles.label }, "Containers returned"), /* @__PURE__ */ import_react.default.createElement(QtyControl, { value: containerReturns, onChange: setContainerReturns }), /* @__PURE__ */ import_react.default.createElement("div", { style: styles.loopHint }, "\u2212$1.00 each"))), /* @__PURE__ */ import_react.default.createElement("label", { style: styles.label }, "Discount"), /* @__PURE__ */ import_react.default.createElement("div", { style: styles.discountRow }, [
      [null, "None"],
      ["percent", "%"],
      ["dollar", "$"]
    ].map(([type, label]) => /* @__PURE__ */ import_react.default.createElement(
      "button",
      {
        key: label,
        style: {
          ...styles.discountTypeBtn,
          ...discountType === type ? styles.discountTypeBtnActive : {}
        },
        onClick: () => setDiscountType(type)
      },
      label
    )), discountType && /* @__PURE__ */ import_react.default.createElement(
      "input",
      {
        style: { ...styles.input, flex: 1, marginTop: 0 },
        type: "number",
        inputMode: "decimal",
        min: "0",
        placeholder: discountType === "percent" ? "e.g. 10" : "e.g. 5.00",
        value: discountValue,
        onChange: (e) => setDiscountValue(e.target.value)
      }
    )), /* @__PURE__ */ import_react.default.createElement("label", { style: styles.label }, "Custom charges"), customCharges.length > 0 && /* @__PURE__ */ import_react.default.createElement("div", { style: styles.customChargeList }, customCharges.map((ch) => /* @__PURE__ */ import_react.default.createElement("div", { key: ch.id, style: styles.customChargeRow }, /* @__PURE__ */ import_react.default.createElement(
      "input",
      {
        style: { ...styles.input, flex: 2, marginTop: 0 },
        placeholder: "what for? e.g. special request",
        value: ch.label,
        onChange: (e) => updateCustomCharge(ch.id, "label", e.target.value)
      }
    ), /* @__PURE__ */ import_react.default.createElement(
      "input",
      {
        style: { ...styles.input, flex: 1, marginTop: 0 },
        type: "number",
        inputMode: "decimal",
        placeholder: "$",
        value: ch.amount,
        onChange: (e) => updateCustomCharge(ch.id, "amount", e.target.value)
      }
    ), /* @__PURE__ */ import_react.default.createElement("button", { style: styles.iconBtn, onClick: () => removeCustomCharge(ch.id), "aria-label": "Remove charge" }, /* @__PURE__ */ import_react.default.createElement(X, { size: 16 }))))), /* @__PURE__ */ import_react.default.createElement("button", { style: styles.addChargeBtn, onClick: addCustomCharge }, /* @__PURE__ */ import_react.default.createElement(Plus, { size: 15 }), " Add a custom charge"), /* @__PURE__ */ import_react.default.createElement("label", { style: styles.label }, "Notes"), /* @__PURE__ */ import_react.default.createElement(
      "textarea",
      {
        style: styles.textarea,
        placeholder: "Anything that isn't tied to one item (delivery time, general message)...",
        value: notes,
        onChange: (e) => setNotes(e.target.value)
      }
    ), itemsUpchargeTotal(items) > 0 && /* @__PURE__ */ import_react.default.createElement("div", { style: styles.extraLine }, /* @__PURE__ */ import_react.default.createElement("span", null, "Item upcharges"), /* @__PURE__ */ import_react.default.createElement("span", null, "+", currency(itemsUpchargeTotal(items)))), disc > 0 && /* @__PURE__ */ import_react.default.createElement("div", { style: styles.discountLine }, /* @__PURE__ */ import_react.default.createElement("span", null, "Discount", discountType === "percent" ? ` (${discNum}%)` : ""), /* @__PURE__ */ import_react.default.createElement("span", null, "\u2212", currency(disc))), customChargesTotal(customCharges) > 0 && /* @__PURE__ */ import_react.default.createElement("div", { style: styles.extraLine }, /* @__PURE__ */ import_react.default.createElement("span", null, "Custom charges"), /* @__PURE__ */ import_react.default.createElement("span", null, "+", currency(customChargesTotal(customCharges)))), /* @__PURE__ */ import_react.default.createElement(
      "button",
      {
        style: styles.waiveSurchargeRow,
        onClick: () => setWaiveSurcharge((v) => !v)
      },
      /* @__PURE__ */ import_react.default.createElement("span", { style: styles.waiveSurchargeLabel }, /* @__PURE__ */ import_react.default.createElement("span", { style: { ...styles.waiveCheckbox, ...waiveSurcharge ? styles.waiveCheckboxOn : {} } }, waiveSurcharge && /* @__PURE__ */ import_react.default.createElement(Check, { size: 12 })), "Waive the $2 surcharge"),
      /* @__PURE__ */ import_react.default.createElement("span", { style: styles.waiveSurchargeHint }, waiveSurcharge ? "waived" : "applied")
    ), /* @__PURE__ */ import_react.default.createElement("div", { style: styles.totalRow }, /* @__PURE__ */ import_react.default.createElement("span", null, "Total ", waiveSurcharge ? "(surcharge waived)" : "(incl. $2 surcharge)"), /* @__PURE__ */ import_react.default.createElement("span", { style: { ...styles.totalValue, ...total < 0 ? { color: "#E8799A" } : {} } }, currency(total))), total < 0 && /* @__PURE__ */ import_react.default.createElement("div", { style: styles.negativeTotalNote }, "This order is below zero, so you'll be covering ", currency(Math.abs(total)), " out of pocket. Saved as-is."), hasPerLbItems && /* @__PURE__ */ import_react.default.createElement("div", { style: styles.weightDeferNote }, "Sous vide proteins are priced by weight \u2014 save the order, then set each weight from the order card once you've weighed them."), /* @__PURE__ */ import_react.default.createElement(
      "button",
      {
        style: { ...styles.saveBtn, ...!customer.trim() || items.length === 0 ? styles.saveBtnDisabled : {} },
        onClick: save,
        disabled: !customer.trim() || items.length === 0
      },
      isEdit ? "Save changes" : "Save order"
    ));
  }
  function InvoiceModal({ order, onClose }) {
    const disc = discountAmount(itemsBaseTotal(order.items), order.discountType, order.discountValue);
    const dateStr = order.createdAt ? new Date(order.createdAt).toLocaleDateString(void 0, { month: "long", day: "numeric", year: "numeric" }) : "";
    return /* @__PURE__ */ import_react.default.createElement("div", { style: styles.invoiceOverlay, onClick: onClose }, /* @__PURE__ */ import_react.default.createElement("div", { style: styles.invoiceScroll, onClick: (e) => e.stopPropagation() }, /* @__PURE__ */ import_react.default.createElement("div", { style: styles.invoiceCard }, /* @__PURE__ */ import_react.default.createElement("div", { style: styles.invoiceHeader }, /* @__PURE__ */ import_react.default.createElement("div", { style: styles.invoiceLogo }, "LTB"), /* @__PURE__ */ import_react.default.createElement("div", null, /* @__PURE__ */ import_react.default.createElement("div", { style: styles.invoiceBrand }, "Lettuce, Turnip, The Beet"), /* @__PURE__ */ import_react.default.createElement("div", { style: styles.invoiceTagline }, "meal prep, delivered fresh"))), /* @__PURE__ */ import_react.default.createElement("div", { style: styles.invoiceMeta }, /* @__PURE__ */ import_react.default.createElement("span", { style: styles.invoiceCustomer }, order.customer), dateStr && /* @__PURE__ */ import_react.default.createElement("span", { style: styles.invoiceDate }, dateStr)), /* @__PURE__ */ import_react.default.createElement("div", { style: styles.invoiceDivider }), /* @__PURE__ */ import_react.default.createElement("div", { style: styles.invoiceItems }, (order.items || []).map((it, idx) => {
      const up = it.upcharge && it.upcharge.amount ? it.upcharge.amount : 0;
      const lineTotal = (it.price + up) * it.qty;
      return /* @__PURE__ */ import_react.default.createElement("div", { key: idx, style: styles.invoiceItemBlock }, /* @__PURE__ */ import_react.default.createElement("div", { style: styles.invoiceItemLine }, /* @__PURE__ */ import_react.default.createElement("span", { style: styles.invoiceItemName }, it.qty, "\xD7 ", it.name), /* @__PURE__ */ import_react.default.createElement("span", { style: styles.invoiceItemPrice }, currency(lineTotal))), /* @__PURE__ */ import_react.default.createElement("div", { style: styles.invoiceItemVariant }, isPerLbItem(it.name) && it.weight ? `${it.weight} lb` : it.variant), it.upcharge && typeof it.upcharge === "object" && it.upcharge.amount > 0 ? /* @__PURE__ */ import_react.default.createElement("div", { style: styles.invoiceItemExtra }, "+ ", it.upcharge.label, " (", currency(it.upcharge.amount), " ea)") : null, it.note && /* @__PURE__ */ import_react.default.createElement("div", { style: styles.invoiceItemNote }, "\u201C", it.note, "\u201D"));
    })), /* @__PURE__ */ import_react.default.createElement("div", { style: styles.invoiceDivider }), /* @__PURE__ */ import_react.default.createElement("div", { style: styles.invoiceTotals }, disc > 0 && /* @__PURE__ */ import_react.default.createElement("div", { style: styles.invoiceTotalRow }, /* @__PURE__ */ import_react.default.createElement("span", { style: { color: "#C0517A" } }, "Discount", order.discountType === "percent" ? ` (${order.discountValue}%)` : ""), /* @__PURE__ */ import_react.default.createElement("span", { style: { color: "#C0517A" } }, "\u2212", currency(disc))), (order.customCharges || []).map((ch) => /* @__PURE__ */ import_react.default.createElement("div", { key: ch.id, style: styles.invoiceTotalRow }, /* @__PURE__ */ import_react.default.createElement("span", null, ch.label), /* @__PURE__ */ import_react.default.createElement("span", null, currency(Number(ch.amount) || 0)))), !order.waiveSurcharge && /* @__PURE__ */ import_react.default.createElement("div", { style: styles.invoiceTotalRow }, /* @__PURE__ */ import_react.default.createElement("span", null, "Order surcharge"), /* @__PURE__ */ import_react.default.createElement("span", null, currency(SURCHARGE))), order.jarSwaps > 0 && /* @__PURE__ */ import_react.default.createElement("div", { style: styles.invoiceTotalRow }, /* @__PURE__ */ import_react.default.createElement("span", null, "Jar swap x", order.jarSwaps), /* @__PURE__ */ import_react.default.createElement("span", null, "\u2212", currency(order.jarSwaps * 2))), order.containerReturns > 0 && /* @__PURE__ */ import_react.default.createElement("div", { style: styles.invoiceTotalRow }, /* @__PURE__ */ import_react.default.createElement("span", null, "Containers returned x", order.containerReturns), /* @__PURE__ */ import_react.default.createElement("span", null, "\u2212", currency(order.containerReturns)))), /* @__PURE__ */ import_react.default.createElement("div", { style: styles.invoiceGrandTotal }, /* @__PURE__ */ import_react.default.createElement("span", null, "Total"), /* @__PURE__ */ import_react.default.createElement("span", { style: styles.invoiceGrandValue }, currency(order.total))), order.notes && /* @__PURE__ */ import_react.default.createElement("div", { style: styles.invoiceNotes }, order.notes), /* @__PURE__ */ import_react.default.createElement("div", { style: styles.invoiceFooter }, "All prices all-in. Thanks for the order!")), /* @__PURE__ */ import_react.default.createElement("button", { style: styles.invoiceClose, onClick: onClose }, "Done"), /* @__PURE__ */ import_react.default.createElement("div", { style: styles.invoiceHint }, "Screenshot the card above to send it.")));
  }
  function WeightPhotoModal({ orderId, itemIdx, item, stepLabel, onApply, onClose }) {
    const [weight, setWeight] = (0, import_react.useState)(item.weight > 0 ? String(item.weight) : "");
    const [photoBase64, setPhotoBase64] = (0, import_react.useState)(null);
    const [existingPhoto, setExistingPhoto] = (0, import_react.useState)(null);
    const [busy, setBusy] = (0, import_react.useState)(false);
    const [err, setErr] = (0, import_react.useState)("");
    (0, import_react.useEffect)(() => {
      let live = true;
      if (item.hasPhoto) {
        loadPhoto(orderId, itemIdx).then((d) => {
          if (live && d) setExistingPhoto(d);
        });
      }
      return () => {
        live = false;
      };
    }, [orderId, itemIdx]);
    const info = PER_LB_ITEMS[item.name] || { pricePerLb: 0, costPerLb: 0 };
    const w = parseFloat(weight);
    const livePrice = w > 0 ? round2(info.pricePerLb * w + 1.5) : null;
    const onPickPhoto = async (e) => {
      const file = e.target.files && e.target.files[0];
      if (!file) return;
      setErr("");
      setBusy(true);
      try {
        const b64 = await fileToJpegBase64(file, 900, 0.6);
        setPhotoBase64(b64);
      } catch (e2) {
        setErr("Could not read that image. Try another.");
      } finally {
        setBusy(false);
      }
    };
    const submit = async () => {
      if (!(w > 0)) return;
      setBusy(true);
      await onApply(itemIdx, Math.round(w * 100) / 100, photoBase64);
      setBusy(false);
      if (!stepLabel) onClose();
    };
    const shownPhoto = photoBase64 ? `data:image/jpeg;base64,${photoBase64}` : existingPhoto ? `data:image/jpeg;base64,${existingPhoto}` : null;
    return /* @__PURE__ */ import_react.default.createElement("div", { style: styles.invoiceOverlay, onClick: onClose }, /* @__PURE__ */ import_react.default.createElement("div", { style: styles.weightModalCard, onClick: (e) => e.stopPropagation() }, /* @__PURE__ */ import_react.default.createElement("div", { style: styles.reviewModalHeader }, /* @__PURE__ */ import_react.default.createElement("div", null, /* @__PURE__ */ import_react.default.createElement("div", { style: styles.reviewModalTitle }, item.name), stepLabel && /* @__PURE__ */ import_react.default.createElement("div", { style: styles.weightStepLabel }, stepLabel)), /* @__PURE__ */ import_react.default.createElement("button", { style: styles.iconBtn, onClick: onClose, "aria-label": "Close" }, /* @__PURE__ */ import_react.default.createElement(X, { size: 18 }))), item.note && /* @__PURE__ */ import_react.default.createElement("div", { style: styles.weightIntentNote }, "Customer asked: ", item.note), /* @__PURE__ */ import_react.default.createElement("label", { style: styles.miniLabel }, "Actual weight (lb) \u2014 ", currency(info.pricePerLb), "/lb + $1.50 bag"), /* @__PURE__ */ import_react.default.createElement(
      "input",
      {
        style: styles.input,
        type: "number",
        inputMode: "decimal",
        placeholder: "e.g. 0.5",
        value: weight,
        onChange: (e) => setWeight(e.target.value),
        autoFocus: true
      }
    ), livePrice !== null && /* @__PURE__ */ import_react.default.createElement("div", { style: styles.weightPriceHint }, "= ", currency(livePrice), " each"), /* @__PURE__ */ import_react.default.createElement("label", { style: { ...styles.miniLabel, marginTop: "14px" } }, "Proof photo (optional) \u2014 item on the scale"), shownPhoto ? /* @__PURE__ */ import_react.default.createElement("div", { style: styles.photoPreviewWrap }, /* @__PURE__ */ import_react.default.createElement("img", { src: shownPhoto, alt: "scale", style: styles.photoPreview }), /* @__PURE__ */ import_react.default.createElement("button", { style: styles.photoRemoveBtn, onClick: () => {
      setPhotoBase64(null);
      setExistingPhoto(null);
    } }, /* @__PURE__ */ import_react.default.createElement(X, { size: 13 }), " Remove")) : /* @__PURE__ */ import_react.default.createElement("label", { style: styles.photoUploadBtn }, /* @__PURE__ */ import_react.default.createElement(ImageIcon, { size: 15 }), busy ? "Working\u2026" : "Add scale photo", /* @__PURE__ */ import_react.default.createElement("input", { type: "file", accept: "image/*", onChange: onPickPhoto, style: { display: "none" } })), err && /* @__PURE__ */ import_react.default.createElement("div", { style: styles.parseError }, err), /* @__PURE__ */ import_react.default.createElement("div", { style: styles.weightModalHint }, "Photos are compressed, saved to this order, and auto-deleted after a month."), /* @__PURE__ */ import_react.default.createElement(
      "button",
      {
        style: { ...styles.saveBtn, marginTop: "14px", ...w > 0 && !busy ? {} : styles.saveBtnDisabled },
        onClick: submit,
        disabled: !(w > 0) || busy
      },
      stepLabel ? "Save & next" : "Save weight"
    )));
  }
  function OrderCard({ order, regulars, expanded, onToggle, onUpdate, onDelete, onEdit }) {
    const [confirmDelete, setConfirmDelete] = (0, import_react.useState)(false);
    const [copied, setCopied] = (0, import_react.useState)(false);
    const [editingNotes, setEditingNotes] = (0, import_react.useState)(false);
    const [notesDraft, setNotesDraft] = (0, import_react.useState)("");
    const [showInvoice, setShowInvoice] = (0, import_react.useState)(false);
    const [weightFlow, setWeightFlow] = (0, import_react.useState)(null);
    const perLbIdxs = (order.items || []).map((it, i) => isPerLbItem(it.name) ? i : -1).filter((i) => i >= 0);
    const anyPending = perLbIdxs.some((i) => order.items[i].weightPending || !(order.items[i].weight > 0));
    const applyWeight = async (itemIdx, weight, photoBase64) => {
      const items = order.items.map((it, i) => {
        if (i !== itemIdx) return it;
        const updated = repricePerLbItem({ ...it, weight });
        if (photoBase64) updated.hasPhoto = true;
        return updated;
      });
      const patch = {
        items,
        total: orderTotal(items, order.jarSwaps, order.containerReturns, order.discountType, order.discountValue, order.customCharges, order.waiveSurcharge)
      };
      onUpdate(patch);
      if (photoBase64) await savePhoto(order.id, itemIdx, photoBase64);
      setWeightFlow((prev) => {
        if (!prev || prev.mode !== "walk") return null;
        const nextPos = prev.pos + 1;
        return nextPos < prev.queue.length ? { ...prev, pos: nextPos } : null;
      });
    };
    const itemsTotal = (order.items || []).reduce((s, it) => s + it.price * it.qty, 0);
    const disc = discountAmount(itemsTotal, order.discountType, order.discountValue);
    const matchedRegular = (0, import_react.useMemo)(() => {
      if (!regulars || regulars.length === 0) return null;
      if (order.regularId) {
        const byId = regulars.find((r) => r.id === order.regularId);
        if (byId) return byId;
      }
      return regulars.find((r) => nameMatchType(r.name, order.customer) === "exact") || null;
    }, [regulars, order.regularId, order.customer]);
    const isRegular = !!matchedRegular;
    const regularDiscount = matchedRegular ? matchedRegular.discountPercent || 0 : 0;
    const discountOn = order.discountType === "percent" && order.discountValue === regularDiscount && regularDiscount > 0;
    const toggleRegularDiscount = (e) => {
      e.stopPropagation();
      if (discountOn) {
        const total = orderTotal(order.items, order.jarSwaps, order.containerReturns, null, 0, order.customCharges, order.waiveSurcharge);
        onUpdate({ discountType: null, discountValue: 0, total });
      } else {
        const total = orderTotal(order.items, order.jarSwaps, order.containerReturns, "percent", regularDiscount, order.customCharges, order.waiveSurcharge);
        onUpdate({ discountType: "percent", discountValue: regularDiscount, total });
      }
    };
    const cycleStatus = (e) => {
      e.stopPropagation();
      const idx = STATUSES.indexOf(order.status);
      onUpdate({ status: STATUSES[(idx + 1) % STATUSES.length] });
    };
    const togglePaid = (e) => {
      e.stopPropagation();
      onUpdate({ paid: !order.paid });
    };
    const doCopy = async () => {
      const ok = await copyText(orderToText(order));
      if (ok) {
        setCopied(true);
        setTimeout(() => setCopied(false), 1600);
      }
    };
    const startNotes = () => {
      setNotesDraft(order.notes || "");
      setEditingNotes(true);
    };
    const saveNotes = () => {
      onUpdate({ notes: notesDraft.trim() });
      setEditingNotes(false);
    };
    return /* @__PURE__ */ import_react.default.createElement("div", { style: styles.orderCard }, /* @__PURE__ */ import_react.default.createElement("div", { style: styles.orderCardHeader, onClick: onToggle, role: "button", tabIndex: 0 }, /* @__PURE__ */ import_react.default.createElement("div", { style: styles.orderCardLeft }, /* @__PURE__ */ import_react.default.createElement("div", { style: styles.orderCustomer }, order.customer, isRegular && /* @__PURE__ */ import_react.default.createElement("span", { style: styles.orderRegularStar }, " \u2605")), /* @__PURE__ */ import_react.default.createElement("div", { style: styles.orderMeta }, (order.items || []).reduce((s, it) => s + it.qty, 0), " item", (order.items || []).reduce((s, it) => s + it.qty, 0) !== 1 ? "s" : "", " ", "\xB7 ", currency(order.total), disc > 0 ? " \xB7 disc" : "", order.createdAt ? ` \xB7 ${formatDate(order.createdAt)}` : "")), /* @__PURE__ */ import_react.default.createElement("div", { style: styles.orderCardRight }, /* @__PURE__ */ import_react.default.createElement(
      "button",
      {
        style: {
          ...styles.paidPill,
          ...order.paid ? { background: "#1D9E7522", color: "#1D9E75" } : { background: "#EF9F2722", color: "#EF9F27" }
        },
        onClick: togglePaid
      },
      order.paid ? "Paid" : "Unpaid"
    ), /* @__PURE__ */ import_react.default.createElement(
      "button",
      {
        style: { ...styles.statusPill, background: `${STATUS_COLORS[order.status]}22`, color: STATUS_COLORS[order.status] },
        onClick: cycleStatus
      },
      order.status
    ), expanded ? /* @__PURE__ */ import_react.default.createElement(ChevronUp, { size: 18 }) : /* @__PURE__ */ import_react.default.createElement(ChevronDown, { size: 18 }))), expanded && /* @__PURE__ */ import_react.default.createElement("div", { style: styles.orderCardBody }, /* @__PURE__ */ import_react.default.createElement("div", { style: styles.orderItemsList }, (order.items || []).map((it, idx) => {
      const perLb = isPerLbItem(it.name);
      const pending = perLb && (it.weightPending || !(it.weight > 0));
      const up = it.upcharge && it.upcharge.amount ? it.upcharge.amount : 0;
      const lineTotal = (it.price + up) * it.qty;
      return /* @__PURE__ */ import_react.default.createElement("div", { key: idx, style: styles.orderItemBlock }, /* @__PURE__ */ import_react.default.createElement("div", { style: styles.orderItemLine }, /* @__PURE__ */ import_react.default.createElement("span", null, it.qty, "\xD7 ", it.name, " ", /* @__PURE__ */ import_react.default.createElement("span", { style: styles.orderItemVariant }, "(", perLb && it.weight > 0 ? `${it.weight} lb` : it.variant, ")")), /* @__PURE__ */ import_react.default.createElement("span", null, pending ? /* @__PURE__ */ import_react.default.createElement("span", { style: styles.pendingPrice }, "weigh after shopping") : currency(lineTotal))), it.upcharge && typeof it.upcharge === "object" && it.upcharge.amount > 0 ? /* @__PURE__ */ import_react.default.createElement("div", { style: styles.orderItemSub }, "+ ", it.upcharge.label, " (", currency(it.upcharge.amount), " ea)") : null, it.note && /* @__PURE__ */ import_react.default.createElement("div", { style: styles.orderItemNote }, "\u201C", it.note, "\u201D"), perLb && /* @__PURE__ */ import_react.default.createElement(
        "button",
        {
          style: styles.setWeightBtn,
          onClick: () => setWeightFlow({ mode: "single", queue: [idx], pos: 0 })
        },
        /* @__PURE__ */ import_react.default.createElement(Scale, { size: 12 }),
        " ",
        it.weight > 0 ? "Update weight" : "Set weight",
        it.hasPhoto ? " \xB7 \u{1F4F7}" : ""
      ));
    }), disc > 0 && /* @__PURE__ */ import_react.default.createElement("div", { style: { ...styles.orderItemLine, color: "#E8799A" } }, /* @__PURE__ */ import_react.default.createElement("span", null, "Discount", order.discountType === "percent" ? ` (${order.discountValue}%)` : ""), /* @__PURE__ */ import_react.default.createElement("span", null, "\u2212", currency(disc))), (order.customCharges || []).map((ch) => /* @__PURE__ */ import_react.default.createElement("div", { key: ch.id, style: styles.orderItemLine }, /* @__PURE__ */ import_react.default.createElement("span", null, ch.label), /* @__PURE__ */ import_react.default.createElement("span", null, currency(Number(ch.amount) || 0))))), (order.jarSwaps > 0 || order.containerReturns > 0) && /* @__PURE__ */ import_react.default.createElement("div", { style: styles.loopSummary }, order.jarSwaps > 0 && /* @__PURE__ */ import_react.default.createElement("span", null, order.jarSwaps, " jar swap", order.jarSwaps > 1 ? "s" : "", " (\u2212", currency(order.jarSwaps * 2), ")"), order.containerReturns > 0 && /* @__PURE__ */ import_react.default.createElement("span", null, order.containerReturns, " container", order.containerReturns > 1 ? "s" : "", " returned (\u2212", currency(order.containerReturns * 1), ")")), isRegular && regularDiscount > 0 && /* @__PURE__ */ import_react.default.createElement("button", { style: styles.regularDiscountToggle, onClick: toggleRegularDiscount }, /* @__PURE__ */ import_react.default.createElement("span", { style: styles.regularDiscountLabel }, "\u2605 ", matchedRegular.name, "'s ", regularDiscount, "% discount"), /* @__PURE__ */ import_react.default.createElement("span", { style: { ...styles.toggleSwitch, ...discountOn ? styles.toggleSwitchOn : {} } }, /* @__PURE__ */ import_react.default.createElement("span", { style: { ...styles.toggleKnob, ...discountOn ? styles.toggleKnobOn : {} } }))), /* @__PURE__ */ import_react.default.createElement("div", { style: styles.notesBlock }, editingNotes ? /* @__PURE__ */ import_react.default.createElement(import_react.default.Fragment, null, /* @__PURE__ */ import_react.default.createElement(
      "textarea",
      {
        style: { ...styles.textarea, minHeight: "50px" },
        value: notesDraft,
        onChange: (e) => setNotesDraft(e.target.value),
        placeholder: "Add a note for this order...",
        autoFocus: true
      }
    ), /* @__PURE__ */ import_react.default.createElement("div", { style: styles.notesEditActions }, /* @__PURE__ */ import_react.default.createElement("button", { style: styles.confirmYesGreen, onClick: saveNotes }, "Save note"), /* @__PURE__ */ import_react.default.createElement("button", { style: styles.confirmNo, onClick: () => setEditingNotes(false) }, "Cancel"))) : order.notes ? /* @__PURE__ */ import_react.default.createElement("div", { style: styles.orderNotes, onClick: startNotes, role: "button", tabIndex: 0 }, order.notes, /* @__PURE__ */ import_react.default.createElement("span", { style: styles.notesEditHint }, " \u2014 tap to edit")) : /* @__PURE__ */ import_react.default.createElement("button", { style: styles.addNoteBtn, onClick: startNotes }, /* @__PURE__ */ import_react.default.createElement(Pencil, { size: 13 }), "Add note")), /* @__PURE__ */ import_react.default.createElement("div", { style: styles.orderCardFooter }, perLbIdxs.length > 1 && /* @__PURE__ */ import_react.default.createElement(
      "button",
      {
        style: styles.updateAllWeightsBtn,
        onClick: () => setWeightFlow({ mode: "walk", queue: perLbIdxs, pos: 0 })
      },
      /* @__PURE__ */ import_react.default.createElement(Scale, { size: 14 }),
      anyPending ? "Set sous vide weights" : "Update sous vide weights",
      " (",
      perLbIdxs.length,
      ")"
    ), /* @__PURE__ */ import_react.default.createElement("div", { style: styles.statusRow }, STATUSES.map((s) => /* @__PURE__ */ import_react.default.createElement(
      "button",
      {
        key: s,
        style: {
          ...styles.statusOption,
          ...order.status === s ? { background: STATUS_COLORS[s], color: "#1a1a1a", borderColor: STATUS_COLORS[s] } : {}
        },
        onClick: () => onUpdate({ status: s })
      },
      s
    ))), /* @__PURE__ */ import_react.default.createElement("div", { style: styles.actionRow }, /* @__PURE__ */ import_react.default.createElement("button", { style: styles.actionBtn, onClick: onEdit }, /* @__PURE__ */ import_react.default.createElement(Pencil, { size: 14 }), "Edit"), /* @__PURE__ */ import_react.default.createElement("button", { style: styles.actionBtn, onClick: doCopy }, /* @__PURE__ */ import_react.default.createElement(Copy, { size: 14 }), copied ? "Copied!" : "Copy text"), /* @__PURE__ */ import_react.default.createElement("button", { style: styles.actionBtn, onClick: () => setShowInvoice(true) }, /* @__PURE__ */ import_react.default.createElement(FileText, { size: 14 }), "Invoice"), confirmDelete ? /* @__PURE__ */ import_react.default.createElement("div", { style: styles.confirmRow }, /* @__PURE__ */ import_react.default.createElement("button", { style: styles.confirmYes, onClick: onDelete }, "Delete"), /* @__PURE__ */ import_react.default.createElement("button", { style: styles.confirmNo, onClick: () => setConfirmDelete(false) }, "Cancel")) : /* @__PURE__ */ import_react.default.createElement("button", { style: { ...styles.actionBtn, color: "#993556" }, onClick: () => setConfirmDelete(true) }, /* @__PURE__ */ import_react.default.createElement(Trash2, { size: 14 }), "Remove")))), showInvoice && /* @__PURE__ */ import_react.default.createElement(InvoiceModal, { order, onClose: () => setShowInvoice(false) }), weightFlow && (() => {
      const itemIdx = weightFlow.queue[weightFlow.pos];
      const it = order.items[itemIdx];
      if (!it) return null;
      return /* @__PURE__ */ import_react.default.createElement(
        WeightPhotoModal,
        {
          orderId: order.id,
          itemIdx,
          item: it,
          stepLabel: weightFlow.mode === "walk" ? `${weightFlow.pos + 1} of ${weightFlow.queue.length}` : null,
          onApply: applyWeight,
          onClose: () => setWeightFlow(null)
        }
      );
    })());
  }
  function ArchiveDeliveredButton({ count, onArchive }) {
    const [confirm, setConfirm] = (0, import_react.useState)(false);
    if (confirm) {
      return /* @__PURE__ */ import_react.default.createElement("div", { style: styles.clearConfirmRow }, /* @__PURE__ */ import_react.default.createElement("span", { style: styles.confirmText }, "Archive all ", count, " delivered order", count !== 1 ? "s" : "", "? They stay in the Money tab."), /* @__PURE__ */ import_react.default.createElement("button", { style: styles.confirmYesGreen, onClick: () => {
        onArchive();
        setConfirm(false);
      } }, "Archive"), /* @__PURE__ */ import_react.default.createElement("button", { style: styles.confirmNo, onClick: () => setConfirm(false) }, "Cancel"));
    }
    return /* @__PURE__ */ import_react.default.createElement("button", { style: styles.clearDeliveredBtn, onClick: () => setConfirm(true) }, /* @__PURE__ */ import_react.default.createElement(Archive, { size: 14 }), "Archive all delivered (start a new week)");
  }
  function CookingList({ items, orderCount, revenue, checks, onToggle, onReset }) {
    if (items.length === 0) {
      return /* @__PURE__ */ import_react.default.createElement("div", { style: styles.emptyState }, /* @__PURE__ */ import_react.default.createElement("div", { style: styles.emptyTitle }, "Nothing to cook yet"), /* @__PURE__ */ import_react.default.createElement("div", { style: styles.emptyBody }, "Active orders will roll up into a cooking list here."));
    }
    const grouped = {};
    items.forEach((it) => {
      if (!grouped[it.category]) grouped[it.category] = [];
      grouped[it.category].push(it);
    });
    const doneCount = items.filter((it) => checks[it.key]).length;
    return /* @__PURE__ */ import_react.default.createElement("div", null, revenue > 0 && /* @__PURE__ */ import_react.default.createElement("div", { style: styles.cookRevenueBar }, /* @__PURE__ */ import_react.default.createElement("span", { style: styles.cookRevenueLabel }, "In active orders"), /* @__PURE__ */ import_react.default.createElement("span", { style: styles.cookRevenueValue }, currency(revenue))), /* @__PURE__ */ import_react.default.createElement("div", { style: styles.cookHeader }, /* @__PURE__ */ import_react.default.createElement("div", { style: styles.cookSummary }, doneCount, "/", items.length, " done \xB7 from ", orderCount, " active order", orderCount !== 1 ? "s" : ""), doneCount > 0 && /* @__PURE__ */ import_react.default.createElement("button", { style: styles.resetBtn, onClick: onReset }, /* @__PURE__ */ import_react.default.createElement(RotateCcw, { size: 13 }), "Reset")), Object.entries(grouped).map(([cat, catItems]) => /* @__PURE__ */ import_react.default.createElement("div", { key: cat, style: styles.cookCategory }, /* @__PURE__ */ import_react.default.createElement("div", { style: styles.cookCategoryTitle }, CATEGORY_LABELS[cat]), catItems.map((it) => {
      const isChecked = !!checks[it.key];
      return /* @__PURE__ */ import_react.default.createElement(
        "button",
        {
          key: it.key,
          style: { ...styles.cookItem, ...isChecked ? styles.cookItemChecked : {} },
          onClick: () => onToggle(it.key)
        },
        /* @__PURE__ */ import_react.default.createElement("div", { style: { ...styles.checkbox, ...isChecked ? styles.checkboxChecked : {} } }, isChecked && /* @__PURE__ */ import_react.default.createElement(Check, { size: 14, color: "#1a1a1a" })),
        /* @__PURE__ */ import_react.default.createElement("div", { style: styles.cookItemText }, /* @__PURE__ */ import_react.default.createElement("div", { style: styles.cookItemName }, it.name), /* @__PURE__ */ import_react.default.createElement("div", { style: styles.cookItemVariant }, it.variant)),
        /* @__PURE__ */ import_react.default.createElement("div", { style: styles.cookItemQty }, "\xD7", it.qty)
      );
    }))));
  }
  function ShoppingList({ items, onChange, onGenerate, activeCount, estCost }) {
    const [input, setInput] = (0, import_react.useState)("");
    const [includeStaples, setIncludeStaples] = (0, import_react.useState)(false);
    const [confirmClear, setConfirmClear] = (0, import_react.useState)(false);
    const addItems = () => {
      const lines = input.split("\n").map((l) => l.replace(/^[\s•*\-–—]+|^\d+[.)]\s*/g, "").trim()).filter(Boolean);
      if (lines.length === 0) return;
      const additions = lines.map((text) => ({ id: uid(), text, checked: false }));
      onChange([...items, ...additions]);
      setInput("");
    };
    const toggle = (id) => {
      onChange(items.map((it) => it.id === id ? { ...it, checked: !it.checked } : it));
    };
    const remove = (id) => {
      onChange(items.filter((it) => it.id !== id));
    };
    const uncheckAll = () => {
      onChange(items.map((it) => ({ ...it, checked: false })));
    };
    const doneCount = items.filter((it) => it.checked).length;
    return /* @__PURE__ */ import_react.default.createElement("div", null, /* @__PURE__ */ import_react.default.createElement("div", { style: styles.genCard }, /* @__PURE__ */ import_react.default.createElement("div", { style: styles.genTitle }, "Build list from this week's orders"), /* @__PURE__ */ import_react.default.createElement("div", { style: styles.genHint }, "Reads every active order and adds up the ingredients per recipe. Re-tap any time orders change \u2014 your manual items and checkmarks stay put."), /* @__PURE__ */ import_react.default.createElement("label", { style: styles.genToggleRow }, /* @__PURE__ */ import_react.default.createElement(
      "input",
      {
        type: "checkbox",
        checked: includeStaples,
        onChange: (e) => setIncludeStaples(e.target.checked),
        style: styles.genCheckbox
      }
    ), "Include pantry staples (soy, spices, oils, etc.)"), /* @__PURE__ */ import_react.default.createElement(
      "button",
      {
        style: { ...styles.saveBtn, marginTop: "8px", ...activeCount === 0 ? styles.saveBtnDisabled : {} },
        onClick: () => onGenerate(includeStaples),
        disabled: activeCount === 0
      },
      activeCount === 0 ? "No active orders yet" : `Generate from ${activeCount} active order${activeCount !== 1 ? "s" : ""}`
    )), estCost > 0 && /* @__PURE__ */ import_react.default.createElement("div", { style: styles.shopCostBar }, /* @__PURE__ */ import_react.default.createElement("span", { style: styles.shopCostLabel }, "Est. ingredient spend for active orders"), /* @__PURE__ */ import_react.default.createElement("span", { style: styles.shopCostValue }, "~", currency(estCost))), /* @__PURE__ */ import_react.default.createElement("div", { style: styles.shopInputRow }, /* @__PURE__ */ import_react.default.createElement(
      "textarea",
      {
        style: { ...styles.textarea, minHeight: "44px", flex: 1 },
        placeholder: "Add an item \u2014 or paste a whole list, one item per line",
        value: input,
        onChange: (e) => setInput(e.target.value)
      }
    ), /* @__PURE__ */ import_react.default.createElement(
      "button",
      {
        style: { ...styles.shopAddBtn, ...!input.trim() ? styles.saveBtnDisabled : {} },
        onClick: addItems,
        disabled: !input.trim()
      },
      /* @__PURE__ */ import_react.default.createElement(Plus, { size: 18 })
    )), items.length === 0 ? /* @__PURE__ */ import_react.default.createElement("div", { style: styles.emptyState }, /* @__PURE__ */ import_react.default.createElement("div", { style: styles.emptyTitle }, "Shopping list is empty"), /* @__PURE__ */ import_react.default.createElement("div", { style: styles.emptyBody }, "Type items one at a time, or paste a whole ingredient list and each line becomes its own entry.")) : /* @__PURE__ */ import_react.default.createElement(import_react.default.Fragment, null, /* @__PURE__ */ import_react.default.createElement("div", { style: styles.cookHeader }, /* @__PURE__ */ import_react.default.createElement("div", { style: styles.cookSummary }, doneCount, "/", items.length, " in the cart"), doneCount > 0 && /* @__PURE__ */ import_react.default.createElement("button", { style: styles.resetBtn, onClick: uncheckAll }, /* @__PURE__ */ import_react.default.createElement(RotateCcw, { size: 13 }), "Uncheck all")), /* @__PURE__ */ import_react.default.createElement("div", null, items.map((it) => /* @__PURE__ */ import_react.default.createElement("div", { key: it.id, style: { ...styles.shopItem, ...it.checked ? styles.cookItemChecked : {} } }, /* @__PURE__ */ import_react.default.createElement("button", { style: styles.shopItemMain, onClick: () => toggle(it.id) }, /* @__PURE__ */ import_react.default.createElement("div", { style: { ...styles.checkbox, ...it.checked ? styles.checkboxChecked : {} } }, it.checked && /* @__PURE__ */ import_react.default.createElement(Check, { size: 14, color: "#1a1a1a" })), /* @__PURE__ */ import_react.default.createElement("span", { style: { ...styles.shopItemText, ...it.checked ? styles.shopItemTextChecked : {} } }, it.text)), /* @__PURE__ */ import_react.default.createElement("button", { style: styles.shopDeleteBtn, onClick: () => remove(it.id), "aria-label": `Remove ${it.text}` }, /* @__PURE__ */ import_react.default.createElement(X, { size: 15 }))))), /* @__PURE__ */ import_react.default.createElement("div", { style: styles.shopBulkRow }, doneCount > 0 && /* @__PURE__ */ import_react.default.createElement("button", { style: styles.resetBtn, onClick: () => onChange(items.filter((it) => !it.checked)) }, /* @__PURE__ */ import_react.default.createElement(Trash2, { size: 13 }), "Remove checked (", doneCount, ")"), confirmClear ? /* @__PURE__ */ import_react.default.createElement("div", { style: styles.confirmRow }, /* @__PURE__ */ import_react.default.createElement("span", { style: styles.confirmText }, "Delete the whole list?"), /* @__PURE__ */ import_react.default.createElement("button", { style: styles.confirmYes, onClick: () => {
      onChange([]);
      setConfirmClear(false);
    } }, "Clear"), /* @__PURE__ */ import_react.default.createElement("button", { style: styles.confirmNo, onClick: () => setConfirmClear(false) }, "Cancel")) : /* @__PURE__ */ import_react.default.createElement("button", { style: { ...styles.resetBtn, color: "#993556" }, onClick: () => setConfirmClear(true) }, /* @__PURE__ */ import_react.default.createElement(Trash2, { size: 13 }), "Clear list"))));
  }
  function ProfitChart({ series }) {
    const W = 320, H = 160;
    const padL = 8, padR = 8, padT = 14, padB = 26;
    const plotW = W - padL - padR;
    const plotH = H - padT - padB;
    const profits = series.map((s) => s.profit);
    const maxP = Math.max(...profits, 0);
    const minP = Math.min(...profits, 0);
    const range = maxP - minP || 1;
    const yFor = (p) => padT + plotH - (p - minP) / range * plotH;
    const zeroY = yFor(0);
    const n = series.length;
    const slotW = plotW / n;
    const barW = Math.min(slotW * 0.6, 34);
    const labelStep = Math.ceil(n / 6);
    const linePts = series.map((s, i) => {
      const cx = padL + slotW * i + slotW / 2;
      return `${cx},${yFor(s.profit)}`;
    }).join(" ");
    const totalProfit = round2(series.reduce((sum, s) => sum + s.profit, 0));
    const avgProfit = round2(totalProfit / n);
    return /* @__PURE__ */ import_react.default.createElement("div", { style: styles.chartCard }, /* @__PURE__ */ import_react.default.createElement("div", { style: styles.chartHeader }, /* @__PURE__ */ import_react.default.createElement("span", { style: styles.chartTitle }, "Profit over time"), /* @__PURE__ */ import_react.default.createElement("span", { style: styles.chartSubtitle }, "avg ", currency(avgProfit), "/period")), /* @__PURE__ */ import_react.default.createElement("svg", { viewBox: `0 0 ${W} ${H}`, style: styles.chartSvg, preserveAspectRatio: "xMidYMid meet" }, /* @__PURE__ */ import_react.default.createElement("line", { x1: padL, y1: zeroY, x2: W - padR, y2: zeroY, stroke: "#37403c", strokeWidth: "1", strokeDasharray: "3,3" }), series.map((s, i) => {
      const cx = padL + slotW * i + slotW / 2;
      const y = yFor(s.profit);
      const barTop = Math.min(y, zeroY);
      const barH = Math.abs(y - zeroY);
      const positive = s.profit >= 0;
      return /* @__PURE__ */ import_react.default.createElement(
        "rect",
        {
          key: i,
          x: cx - barW / 2,
          y: barTop,
          width: barW,
          height: Math.max(barH, 1),
          rx: "2",
          fill: positive ? "#1D9E7544" : "#EF444444"
        }
      );
    }), n >= 2 && /* @__PURE__ */ import_react.default.createElement("polyline", { points: linePts, fill: "none", stroke: "#5DCAA5", strokeWidth: "2", strokeLinejoin: "round", strokeLinecap: "round" }), series.map((s, i) => {
      const cx = padL + slotW * i + slotW / 2;
      return /* @__PURE__ */ import_react.default.createElement("circle", { key: i, cx, cy: yFor(s.profit), r: "2.5", fill: "#5DCAA5" });
    }), series.map((s, i) => {
      if (i % labelStep !== 0 && i !== n - 1) return null;
      const cx = padL + slotW * i + slotW / 2;
      return /* @__PURE__ */ import_react.default.createElement("text", { key: i, x: cx, y: H - 8, textAnchor: "middle", fontSize: "8", fill: "#7a8480" }, shortLabel(s.label));
    })), /* @__PURE__ */ import_react.default.createElement("div", { style: styles.chartLegend }, "Each bar is one ", series.length > 1 ? "period" : "period", "'s estimated profit. Green line shows the trend."));
  }
  function shortLabel(label) {
    if (!label) return "";
    return label.replace(/^Week of /, "").replace(/^Week /, "W").slice(0, 9);
  }
  function MoneyTab({ orders, onUpdate }) {
    const [sortField, setSortField] = (0, import_react.useState)("date");
    const [sortDir, setSortDir] = (0, import_react.useState)("desc");
    const [groupMode, setGroupMode] = (0, import_react.useState)("none");
    const [unpaidOnly, setUnpaidOnly] = (0, import_react.useState)(false);
    const [openPhotos, setOpenPhotos] = (0, import_react.useState)(null);
    const [storage, setStorage] = (0, import_react.useState)(null);
    const [search, setSearch] = (0, import_react.useState)("");
    const [showChart, setShowChart] = (0, import_react.useState)(false);
    (0, import_react.useEffect)(() => {
      let live = true;
      photoStorageBytes().then((s) => {
        if (live) setStorage(s);
      });
      return () => {
        live = false;
      };
    }, [orders]);
    const filtered = (0, import_react.useMemo)(() => {
      let arr = unpaidOnly ? orders.filter((o) => !o.paid) : orders;
      const q = search.trim().toLowerCase();
      if (q) arr = arr.filter((o) => (o.customer || "").toLowerCase().includes(q));
      return arr;
    }, [orders, unpaidOnly, search]);
    const totals = (0, import_react.useMemo)(() => {
      let booked = 0, collected = 0, cost = 0, costComplete = true;
      filtered.forEach((o) => {
        booked += o.total;
        if (o.paid) collected += o.total;
        const info = orderCostInfo(o);
        cost += info.cost;
        if (!info.complete) costComplete = false;
      });
      return {
        booked: round2(booked),
        collected: round2(collected),
        outstanding: round2(booked - collected),
        profit: round2(booked - cost),
        costComplete,
        count: filtered.length
      };
    }, [filtered]);
    const sorted = (0, import_react.useMemo)(() => {
      const arr = [...filtered];
      arr.sort((a, b) => {
        let cmp = 0;
        if (sortField === "date") cmp = new Date(a.createdAt || 0) - new Date(b.createdAt || 0);
        if (sortField === "total") cmp = a.total - b.total;
        if (sortField === "name") cmp = (a.customer || "").localeCompare(b.customer || "");
        return sortDir === "asc" ? cmp : -cmp;
      });
      return arr;
    }, [filtered, sortField, sortDir]);
    const groups = (0, import_react.useMemo)(() => {
      if (groupMode === "none") return [{ label: null, stamp: 0, orders: sorted }];
      const map = /* @__PURE__ */ new Map();
      sorted.forEach((o) => {
        const { label, stamp } = groupKeyFor(o, groupMode);
        if (!map.has(label)) map.set(label, { label, stamp, orders: [] });
        map.get(label).orders.push(o);
      });
      return Array.from(map.values()).sort((a, b) => b.stamp - a.stamp);
    }, [sorted, groupMode]);
    const profitSeries = (0, import_react.useMemo)(() => {
      const mode = groupMode === "none" ? "week" : groupMode;
      const map = /* @__PURE__ */ new Map();
      filtered.forEach((o) => {
        const { label, stamp } = groupKeyFor(o, mode);
        if (!map.has(label)) map.set(label, { label, stamp, profit: 0, revenue: 0 });
        const e = map.get(label);
        e.revenue += o.total;
        e.profit += o.total - orderCostInfo(o).cost;
      });
      return Array.from(map.values()).sort((a, b) => a.stamp - b.stamp).map((e) => ({ ...e, profit: round2(e.profit), revenue: round2(e.revenue) }));
    }, [filtered, groupMode]);
    const setSort = (field) => {
      if (sortField === field) {
        setSortDir((d) => d === "asc" ? "desc" : "asc");
      } else {
        setSortField(field);
        setSortDir(field === "name" ? "asc" : "desc");
      }
    };
    if (orders.length === 0) {
      return /* @__PURE__ */ import_react.default.createElement("div", { style: styles.emptyState }, /* @__PURE__ */ import_react.default.createElement("div", { style: styles.emptyTitle }, "No history yet"), /* @__PURE__ */ import_react.default.createElement("div", { style: styles.emptyBody }, "Every order you save shows up here \u2014 including archived past weeks."));
    }
    return /* @__PURE__ */ import_react.default.createElement("div", null, /* @__PURE__ */ import_react.default.createElement("div", { style: styles.moneyStatsBar }, /* @__PURE__ */ import_react.default.createElement("div", { style: styles.moneyStatTile }, /* @__PURE__ */ import_react.default.createElement("div", { style: styles.statValue }, currency(totals.booked)), /* @__PURE__ */ import_react.default.createElement("div", { style: styles.statLabel }, unpaidOnly ? "Unpaid total" : "Revenue")), /* @__PURE__ */ import_react.default.createElement("div", { style: styles.moneyStatTile }, /* @__PURE__ */ import_react.default.createElement("div", { style: { ...styles.statValue, color: "#1D9E75" } }, currency(totals.profit), totals.costComplete ? "" : "*"), /* @__PURE__ */ import_react.default.createElement("div", { style: styles.statLabel }, "Est. profit")), /* @__PURE__ */ import_react.default.createElement("div", { style: styles.moneyStatTile }, /* @__PURE__ */ import_react.default.createElement("div", { style: { ...styles.statValue, color: "#1D9E75" } }, currency(totals.collected)), /* @__PURE__ */ import_react.default.createElement("div", { style: styles.statLabel }, "Collected")), /* @__PURE__ */ import_react.default.createElement("div", { style: styles.moneyStatTile }, /* @__PURE__ */ import_react.default.createElement("div", { style: { ...styles.statValue, ...totals.outstanding > 0 ? { color: "#EF9F27" } : {} } }, currency(totals.outstanding)), /* @__PURE__ */ import_react.default.createElement("div", { style: styles.statLabel }, "Outstanding"))), !totals.costComplete && /* @__PURE__ */ import_react.default.createElement("div", { style: styles.moneyFootnote }, "* some items predate cost tracking, so profit is partial"), /* @__PURE__ */ import_react.default.createElement("div", { style: styles.sortRow }, [
      ["date", "Date"],
      ["total", "Amount"],
      ["name", "Customer"]
    ].map(([field, label]) => /* @__PURE__ */ import_react.default.createElement(
      "button",
      {
        key: field,
        style: { ...styles.sortBtn, ...sortField === field ? styles.sortBtnActive : {} },
        onClick: () => setSort(field)
      },
      label,
      sortField === field && /* @__PURE__ */ import_react.default.createElement("span", { style: styles.sortDirText }, sortDir === "asc" ? "\u2191" : "\u2193")
    )), /* @__PURE__ */ import_react.default.createElement(
      "button",
      {
        style: { ...styles.sortBtn, ...unpaidOnly ? { color: "#EF9F27", borderColor: "#EF9F27" } : {} },
        onClick: () => setUnpaidOnly((v) => !v)
      },
      "Unpaid only"
    )), /* @__PURE__ */ import_react.default.createElement("div", { style: styles.sortRow }, /* @__PURE__ */ import_react.default.createElement("span", { style: styles.groupLabel }, "Group:"), [
      ["none", "None"],
      ["week", "Week"],
      ["month", "Month"],
      ["year", "Year"]
    ].map(([mode, label]) => /* @__PURE__ */ import_react.default.createElement(
      "button",
      {
        key: mode,
        style: { ...styles.sortBtn, ...groupMode === mode ? styles.sortBtnActive : {} },
        onClick: () => setGroupMode(mode)
      },
      label
    )), /* @__PURE__ */ import_react.default.createElement("div", { style: styles.moneyCount }, totals.count, " order", totals.count !== 1 ? "s" : "")), /* @__PURE__ */ import_react.default.createElement("div", { style: styles.moneySearchRow }, /* @__PURE__ */ import_react.default.createElement(
      "input",
      {
        style: styles.moneySearchInput,
        placeholder: "Search by customer name...",
        value: search,
        onChange: (e) => setSearch(e.target.value)
      }
    ), search && /* @__PURE__ */ import_react.default.createElement("button", { style: styles.moneySearchClear, onClick: () => setSearch(""), "aria-label": "Clear search" }, /* @__PURE__ */ import_react.default.createElement(X, { size: 15 })), profitSeries.length >= 2 && /* @__PURE__ */ import_react.default.createElement(
      "button",
      {
        style: { ...styles.chartToggleBtn, ...showChart ? styles.chartToggleBtnActive : {} },
        onClick: () => setShowChart((v) => !v)
      },
      showChart ? "Hide graph" : "Graph"
    )), showChart && profitSeries.length >= 2 && /* @__PURE__ */ import_react.default.createElement(ProfitChart, { series: profitSeries }), groups.map((group) => {
      let gRev = 0, gCost = 0, gCollected = 0;
      group.orders.forEach((o) => {
        gRev += o.total;
        gCost += orderCostInfo(o).cost;
        if (o.paid) gCollected += o.total;
      });
      const gProfit = round2(gRev - gCost);
      const gOutstanding = round2(gRev - gCollected);
      return /* @__PURE__ */ import_react.default.createElement("div", { key: group.label || "all", style: styles.moneyGroup }, group.label && /* @__PURE__ */ import_react.default.createElement("div", { style: styles.groupHeaderRich }, /* @__PURE__ */ import_react.default.createElement("div", { style: styles.groupHeaderTop }, /* @__PURE__ */ import_react.default.createElement("span", { style: styles.groupTitle }, group.label), /* @__PURE__ */ import_react.default.createElement("span", { style: styles.groupOrderCount }, group.orders.length, " order", group.orders.length !== 1 ? "s" : "")), /* @__PURE__ */ import_react.default.createElement("div", { style: styles.groupStatsRow }, /* @__PURE__ */ import_react.default.createElement("div", { style: styles.groupStat }, /* @__PURE__ */ import_react.default.createElement("span", { style: styles.groupStatValue }, currency(round2(gRev))), /* @__PURE__ */ import_react.default.createElement("span", { style: styles.groupStatLabel }, "revenue")), /* @__PURE__ */ import_react.default.createElement("div", { style: styles.groupStat }, /* @__PURE__ */ import_react.default.createElement("span", { style: { ...styles.groupStatValue, color: "#1D9E75" } }, currency(gProfit)), /* @__PURE__ */ import_react.default.createElement("span", { style: styles.groupStatLabel }, "profit")), /* @__PURE__ */ import_react.default.createElement("div", { style: styles.groupStat }, /* @__PURE__ */ import_react.default.createElement("span", { style: { ...styles.groupStatValue, color: gOutstanding > 0 ? "#EF9F27" : "#9aa5a0" } }, currency(gOutstanding)), /* @__PURE__ */ import_react.default.createElement("span", { style: styles.groupStatLabel }, "outstanding")))), /* @__PURE__ */ import_react.default.createElement("div", { style: styles.moneyList }, group.orders.map((o) => {
        const info = orderCostInfo(o);
        const profit = round2(o.total - info.cost);
        const photoItems = (o.items || []).map((it, i) => ({ it, i })).filter(({ it }) => it.hasPhoto);
        return /* @__PURE__ */ import_react.default.createElement("div", { key: o.id, style: { ...styles.moneyRowWrap, ...o.archived ? { opacity: 0.65 } : {} } }, /* @__PURE__ */ import_react.default.createElement(
          "div",
          {
            style: { ...styles.moneyRow, ...photoItems.length ? { cursor: "pointer" } : {} },
            onClick: photoItems.length ? () => setOpenPhotos(openPhotos === o.id ? null : o.id) : void 0
          },
          /* @__PURE__ */ import_react.default.createElement("div", { style: styles.moneyRowLeft }, /* @__PURE__ */ import_react.default.createElement("div", { style: styles.moneyName }, o.customer, photoItems.length > 0 && /* @__PURE__ */ import_react.default.createElement(Camera, { size: 12, style: { marginLeft: 6, verticalAlign: "middle", opacity: 0.7 } })), /* @__PURE__ */ import_react.default.createElement("div", { style: styles.moneyMeta }, formatDate(o.createdAt), o.archived ? " \xB7 archived" : ` \xB7 ${o.status}`, photoItems.length > 0 ? ` \xB7 ${photoItems.length} photo${photoItems.length !== 1 ? "s" : ""}` : "")),
          /* @__PURE__ */ import_react.default.createElement("div", { style: styles.moneyRowRight }, /* @__PURE__ */ import_react.default.createElement("div", { style: styles.moneyAmounts }, /* @__PURE__ */ import_react.default.createElement("span", { style: styles.moneyAmount }, currency(o.total)), /* @__PURE__ */ import_react.default.createElement("span", { style: styles.moneyProfit }, info.complete || info.cost > 0 ? `+${currency(profit)}${info.complete ? "" : "*"}` : "\u2014")), /* @__PURE__ */ import_react.default.createElement(
            "button",
            {
              style: {
                ...styles.paidPill,
                ...o.paid ? { background: "#1D9E7522", color: "#1D9E75" } : { background: "#EF9F2722", color: "#EF9F27" }
              },
              onClick: (e) => {
                e.stopPropagation();
                onUpdate(o.id, { paid: !o.paid });
              }
            },
            o.paid ? "Paid" : "Unpaid"
          ))
        ), openPhotos === o.id && photoItems.length > 0 && /* @__PURE__ */ import_react.default.createElement(OrderPhotos, { orderId: o.id, photoItems }));
      })));
    }), storage && storage.count > 0 && /* @__PURE__ */ import_react.default.createElement("div", { style: styles.storageGauge }, /* @__PURE__ */ import_react.default.createElement(Camera, { size: 13 }), /* @__PURE__ */ import_react.default.createElement("span", null, storage.count, " scale photo", storage.count !== 1 ? "s" : "", " stored \xB7 ", fmtBytes(storage.bytes)), /* @__PURE__ */ import_react.default.createElement("span", { style: styles.storageGaugeNote }, "auto-deleted after 1 month")));
  }
  function OrderPhotos({ orderId, photoItems }) {
    const [photos, setPhotos] = (0, import_react.useState)({});
    (0, import_react.useEffect)(() => {
      let live = true;
      (async () => {
        for (const { i } of photoItems) {
          const d = await loadPhoto(orderId, i);
          if (!live) return;
          setPhotos((prev) => ({ ...prev, [i]: d || "none" }));
        }
      })();
      return () => {
        live = false;
      };
    }, [orderId]);
    return /* @__PURE__ */ import_react.default.createElement("div", { style: styles.orderPhotosWrap }, photoItems.map(({ it, i }) => /* @__PURE__ */ import_react.default.createElement("div", { key: i, style: styles.orderPhotoItem }, /* @__PURE__ */ import_react.default.createElement("div", { style: styles.orderPhotoLabel }, it.name, it.weight > 0 ? ` \xB7 ${it.weight} lb` : ""), photos[i] === void 0 && /* @__PURE__ */ import_react.default.createElement("div", { style: styles.orderPhotoLoading }, "loading\u2026"), photos[i] === "none" && /* @__PURE__ */ import_react.default.createElement("div", { style: styles.orderPhotoLoading }, "photo expired or missing"), photos[i] && photos[i] !== "none" && /* @__PURE__ */ import_react.default.createElement("img", { src: `data:image/jpeg;base64,${photos[i]}`, alt: `${it.name} on scale`, style: styles.orderPhotoImg }))));
  }
  var TEAL_DARK = "#1a3a3a";
  var TEAL_MID = "#2E6B6B";
  var TEAL_LIGHT = "#5DCAA5";
  var GOLD = "#C49A3C";
  var CREAM = "#F5F0E8";
  var DARK = "#1a1a1a";
  var CARD = "#222826";
  var styles = {
    page: {
      minHeight: "100vh",
      background: DARK,
      color: CREAM,
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      paddingBottom: "40px"
    },
    loadingText: {
      padding: "40px 20px",
      textAlign: "center",
      color: "#9aa5a0"
    },
    header: {
      background: TEAL_DARK,
      borderBottom: `2px solid ${GOLD}`,
      padding: "16px 16px 0",
      position: "sticky",
      top: 0,
      zIndex: 10
    },
    headerTop: {
      display: "flex",
      alignItems: "center",
      gap: "10px",
      marginBottom: "14px"
    },
    headerCenter: {
      flex: 1
    },
    headerActions: {
      display: "flex",
      gap: "6px",
      alignItems: "center",
      flexShrink: 0
    },
    headerActionBtn: {
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      width: "34px",
      height: "34px",
      background: "transparent",
      border: "1px solid #37403c",
      borderRadius: "8px",
      color: "#9aa5a0",
      cursor: "pointer",
      flexShrink: 0
    },
    exportMsg: {
      fontSize: "12px",
      color: TEAL_LIGHT,
      background: "#0f2e2a",
      border: `1px solid ${TEAL_MID}`,
      borderRadius: "6px",
      padding: "7px 12px",
      margin: "0 16px 8px",
      textAlign: "center"
    },
    importModalCard: {
      width: "100%",
      maxWidth: "420px",
      background: CARD,
      border: `1px solid ${TEAL_MID}`,
      borderRadius: "14px",
      padding: "18px",
      boxSizing: "border-box"
    },
    importModalHint: {
      fontSize: "13px",
      color: "#9aa5a0",
      marginBottom: "10px",
      lineHeight: 1.4
    },
    logoMark: {
      width: "40px",
      height: "40px",
      borderRadius: "50%",
      background: "#085041",
      border: `1.5px solid ${TEAL_LIGHT}`,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: "13px",
      fontWeight: 700,
      color: TEAL_LIGHT,
      flexShrink: 0
    },
    title: {
      fontSize: "17px",
      fontWeight: 700,
      color: "#fff"
    },
    subtitle: {
      fontSize: "12px",
      color: TEAL_LIGHT
    },
    tabs: {
      display: "flex",
      gap: "2px"
    },
    tab: {
      flex: 1,
      background: "transparent",
      border: "none",
      color: "#9aa5a0",
      fontSize: "13px",
      fontWeight: 600,
      padding: "10px 4px",
      borderBottom: "2px solid transparent",
      cursor: "pointer",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: "5px"
    },
    tabActive: {
      color: TEAL_LIGHT,
      borderBottom: `2px solid ${TEAL_LIGHT}`
    },
    tabBadge: {
      background: TEAL_LIGHT,
      color: "#04342C",
      borderRadius: "10px",
      fontSize: "11px",
      fontWeight: 700,
      padding: "1px 7px"
    },
    errorBanner: {
      display: "block",
      width: "100%",
      background: "#501313",
      color: "#F7C1C1",
      padding: "10px 16px",
      fontSize: "13px",
      textAlign: "center",
      border: "none",
      borderBottom: "1px solid #6b1a1a",
      cursor: "pointer"
    },
    errorRetry: {
      display: "block",
      fontSize: "11px",
      color: "#F7C1C1",
      opacity: 0.7,
      marginTop: "3px",
      textDecoration: "underline"
    },
    main: {
      padding: "16px",
      maxWidth: "560px",
      margin: "0 auto"
    },
    statsBar: {
      display: "flex",
      gap: "8px",
      marginBottom: "14px"
    },
    statTile: {
      flex: 1,
      background: CARD,
      border: "1px solid #37403c",
      borderRadius: "10px",
      padding: "10px 8px",
      textAlign: "center"
    },
    statValue: {
      fontSize: "16px",
      fontWeight: 700,
      color: TEAL_LIGHT
    },
    statLabel: {
      fontSize: "11px",
      color: "#9aa5a0",
      marginTop: "2px"
    },
    topActions: {
      display: "flex",
      gap: "8px",
      marginBottom: "16px",
      flexWrap: "wrap"
    },
    newOrderBtn: {
      flex: 1.4,
      background: "#085041",
      color: TEAL_LIGHT,
      border: `1px solid ${TEAL_MID}`,
      borderRadius: "10px",
      padding: "14px",
      fontSize: "15px",
      fontWeight: 600,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: "8px",
      cursor: "pointer"
    },
    pasteBtn: {
      flex: 1,
      background: "transparent",
      color: "#B5A2E8",
      border: "1px solid #7F77DD",
      borderRadius: "10px",
      padding: "14px",
      fontSize: "14px",
      fontWeight: 600,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: "8px",
      cursor: "pointer"
    },
    // Disabled-button look for the dormant AI text features (GitHub build).
    disabledBtn: {
      opacity: 0.4,
      cursor: "not-allowed",
      filter: "grayscale(100%)"
    },
    // ── Pending form orders styles ────────────────────────────────────────────
    pendingSection: {
      marginBottom: "12px",
      borderRadius: "12px",
      border: "2px solid #c9a84c",
      overflow: "hidden"
    },
    pendingSectionHeader: {
      background: "#2a3a2a",
      padding: "10px 14px",
      display: "flex",
      alignItems: "center",
      gap: "8px"
    },
    pendingSectionTitle: {
      color: "#c9a84c",
      fontWeight: 700,
      fontSize: "13px",
      letterSpacing: "0.5px",
      textTransform: "uppercase"
    },
    pendingBadge: {
      background: "#c9a84c",
      color: "#1a3a3a",
      borderRadius: "10px",
      padding: "1px 7px",
      fontSize: "12px",
      fontWeight: 800
    },
    pendingRow: {
      width: "100%",
      background: "#1e2e1e",
      border: "none",
      borderTop: "1px solid #2d4a2d",
      padding: "12px 14px",
      display: "flex",
      alignItems: "center",
      gap: "8px",
      cursor: "pointer",
      color: "#d4c9a8",
      textAlign: "left"
    },
    pendingRowName: {
      flex: 1,
      fontWeight: 600,
      fontSize: "14px"
    },
    pendingRowCount: {
      fontSize: "12px",
      color: "#9aa5a0"
    },
    pendingCard: {
      background: "#1e2e1e",
      borderTop: "1px solid #2d4a2d",
      padding: "14px"
    },
    pendingCardHeader: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "baseline",
      marginBottom: "10px"
    },
    pendingCardName: {
      fontWeight: 700,
      fontSize: "15px",
      color: "#e8dfc0"
    },
    pendingCardTime: {
      fontSize: "11px",
      color: "#9aa5a0"
    },
    pendingItemList: {
      marginBottom: "12px"
    },
    pendingItem: {
      padding: "4px 0",
      borderBottom: "1px solid #2d4a2d",
      fontSize: "13px"
    },
    pendingItemName: {
      color: "#d4c9a8",
      fontWeight: 600
    },
    pendingItemVariant: {
      color: "#9aa5a0"
    },
    pendingItemPrice: {
      color: "#c9a84c",
      float: "right"
    },
    pendingNotes: {
      marginTop: "8px",
      fontSize: "12px",
      color: "#9aa5a0",
      fontStyle: "italic"
    },
    pendingActions: {
      display: "flex",
      gap: "8px"
    },
    pendingAcceptBtn: {
      flex: 1,
      background: "#1D9E75",
      color: "#fff",
      border: "none",
      borderRadius: "8px",
      padding: "10px",
      fontSize: "13px",
      fontWeight: 700,
      cursor: "pointer",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: "6px"
    },
    pendingRejectBtn: {
      flex: 1,
      background: "#8B2020",
      color: "#fff",
      border: "none",
      borderRadius: "8px",
      padding: "10px",
      fontSize: "13px",
      fontWeight: 700,
      cursor: "pointer",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: "6px"
    },
    pendingBackBtn: {
      background: "transparent",
      color: "#9aa5a0",
      border: "1px solid #37403c",
      borderRadius: "8px",
      padding: "10px 14px",
      fontSize: "13px",
      cursor: "pointer"
    },
    pendingNotesSection: {
      marginBottom: "10px"
    },
    parsedNotesCard: {
      background: "#1a2e1a",
      border: "1px solid #3a6a3a",
      borderRadius: "8px",
      padding: "10px",
      marginTop: "6px"
    },
    parsedNotesTitle: {
      fontSize: "11px",
      fontWeight: 700,
      color: "#7abf7a",
      textTransform: "uppercase",
      letterSpacing: "0.5px",
      marginBottom: "6px"
    },
    parsedNotesSummary: {
      fontSize: "13px",
      color: "#e8dfc0",
      fontWeight: 600,
      marginBottom: "6px"
    },
    parsedNotesItem: {
      fontSize: "12px",
      color: "#9aa5a0",
      marginBottom: "3px"
    },
    parsedNotesKey: {
      color: "#c9a84c",
      fontWeight: 600,
      textTransform: "capitalize"
    },
    parseNotesBtn: {
      marginTop: "6px",
      background: "#1a2e1a",
      color: "#7abf7a",
      border: "1px solid #3a6a3a",
      borderRadius: "8px",
      padding: "8px 12px",
      fontSize: "12px",
      fontWeight: 600,
      cursor: "pointer",
      width: "100%"
    },
    // ── Regulars: list, form, profile ──────────────────────────────────────────
    addRegularBtn: {
      width: "100%",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: "8px",
      background: "#c9a84c",
      color: "#1a3a3a",
      border: "none",
      borderRadius: "10px",
      padding: "13px",
      fontSize: "14px",
      fontWeight: 700,
      cursor: "pointer",
      marginBottom: "12px"
    },
    regularsList: {
      display: "flex",
      flexDirection: "column",
      gap: "8px"
    },
    regularRow: {
      width: "100%",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      background: "#232a28",
      border: "1px solid #2d3a36",
      borderRadius: "10px",
      padding: "14px",
      cursor: "pointer",
      color: "#e8e2d4",
      textAlign: "left"
    },
    regularRowLeft: { flex: 1 },
    regularRowName: { fontSize: "15px", fontWeight: 700, color: "#f2f2f0" },
    regularRowMeta: { fontSize: "12px", color: "#9aa5a0", marginTop: "2px" },
    regularStar: { color: "#c9a84c" },
    regularFormCard: {
      background: "#232a28",
      border: "1px solid #2d3a36",
      borderRadius: "12px",
      padding: "14px"
    },
    regularFormHint: {
      fontSize: "11px",
      color: "#9aa5a0",
      fontStyle: "italic",
      marginTop: "4px",
      marginBottom: "4px"
    },
    regularFormActions: {
      display: "flex",
      gap: "8px",
      marginTop: "14px"
    },
    profileBackBtn: {
      background: "transparent",
      color: "#7abf7a",
      border: "none",
      fontSize: "14px",
      fontWeight: 600,
      cursor: "pointer",
      padding: "4px 0",
      marginBottom: "8px"
    },
    profileHeader: {
      background: "linear-gradient(135deg, #1a3a3a, #232a28)",
      border: "1px solid #2d6a6a",
      borderRadius: "12px",
      padding: "16px",
      marginBottom: "12px"
    },
    profileName: {
      fontSize: "20px",
      fontWeight: 800,
      color: "#f2f2f0",
      marginBottom: "12px"
    },
    profileSummaryGrid: {
      display: "flex",
      justifyContent: "space-between",
      gap: "8px"
    },
    profileStat: {
      flex: 1,
      textAlign: "center",
      background: "#1a1a1a55",
      borderRadius: "8px",
      padding: "8px 4px"
    },
    profileStatNum: { fontSize: "15px", fontWeight: 700, color: "#c9a84c" },
    profileStatLabel: { fontSize: "10px", color: "#9aa5a0", textTransform: "uppercase", letterSpacing: "0.5px", marginTop: "2px" },
    profileDiscountBadge: {
      marginTop: "10px",
      display: "inline-block",
      background: "#c9a84c22",
      color: "#c9a84c",
      border: "1px solid #c9a84c55",
      borderRadius: "6px",
      padding: "4px 10px",
      fontSize: "12px",
      fontWeight: 600
    },
    profileSection: {
      background: "#232a28",
      border: "1px solid #2d3a36",
      borderRadius: "12px",
      padding: "14px",
      marginBottom: "10px"
    },
    profileSectionTitle: {
      fontSize: "12px",
      fontWeight: 700,
      color: "#c9a84c",
      textTransform: "uppercase",
      letterSpacing: "0.5px",
      marginBottom: "8px"
    },
    profileField: { fontSize: "13px", color: "#d8d2c4", marginBottom: "4px", lineHeight: 1.4 },
    profileFieldKey: { color: "#9aa5a0", fontWeight: 600 },
    profileFieldEmpty: { fontSize: "13px", color: "#6a726c", fontStyle: "italic" },
    profileEditBtn: {
      marginTop: "8px",
      display: "inline-flex",
      alignItems: "center",
      gap: "5px",
      background: "transparent",
      color: "#7abf7a",
      border: "1px solid #37403c",
      borderRadius: "7px",
      padding: "6px 10px",
      fontSize: "12px",
      cursor: "pointer"
    },
    profileNotes: {
      fontSize: "13px",
      color: "#d8d2c4",
      lineHeight: 1.5,
      whiteSpace: "pre-wrap"
    },
    profileNoteLine: { marginBottom: "3px" },
    profileInsightLine: {
      marginBottom: "4px",
      color: "#7abf7a",
      fontSize: "12px",
      fontStyle: "italic",
      background: "#1a2e1a",
      borderRadius: "5px",
      padding: "4px 7px"
    },
    profileHistoryList: { display: "flex", flexDirection: "column", gap: "6px" },
    profileHistoryRow: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "flex-start",
      borderBottom: "1px solid #2d3a36",
      paddingBottom: "6px"
    },
    profileHistoryLeft: { flex: 1, paddingRight: "8px" },
    profileHistoryDate: { fontSize: "12px", fontWeight: 600, color: "#d8d2c4" },
    profileHistoryItems: { fontSize: "11px", color: "#9aa5a0", marginTop: "2px", lineHeight: 1.3 },
    profileHistoryRight: { display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "2px" },
    profileHistoryTotal: { fontSize: "13px", fontWeight: 700, color: "#c9a84c" },
    profileUnlinkBtn: {
      background: "transparent",
      color: "#8a928c",
      border: "none",
      fontSize: "11px",
      cursor: "pointer",
      textDecoration: "underline",
      padding: 0
    },
    profileLinkBtn: {
      marginTop: "10px",
      width: "100%",
      background: "#1f2937",
      color: "#93b4d4",
      border: "1px solid #3d5a7a",
      borderRadius: "8px",
      padding: "10px",
      fontSize: "13px",
      fontWeight: 600,
      cursor: "pointer"
    },
    linkBrowser: { marginTop: "10px" },
    linkBrowserList: { marginTop: "8px", display: "flex", flexDirection: "column", gap: "5px", maxHeight: "300px", overflowY: "auto" },
    linkBrowserRow: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      background: "#1a1a1a",
      border: "1px solid #2d3a36",
      borderRadius: "7px",
      padding: "9px 11px",
      cursor: "pointer",
      textAlign: "left"
    },
    linkBrowserRowLeft: { display: "flex", flexDirection: "column", flex: 1 },
    linkBrowserName: { fontSize: "13px", fontWeight: 600, color: "#e8e2d4" },
    linkBrowserItems: { fontSize: "10px", color: "#8a928c", marginTop: "1px" },
    linkBrowserMeta: { fontSize: "10px", color: "#9aa5a0", textAlign: "right" },
    profileDeleteBtn: {
      display: "inline-flex",
      alignItems: "center",
      gap: "5px",
      background: "transparent",
      color: "#C0517A",
      border: "1px solid #5a2a3a",
      borderRadius: "7px",
      padding: "8px 12px",
      fontSize: "12px",
      cursor: "pointer"
    },
    profileDeleteConfirm: {
      fontSize: "13px",
      color: "#d8d2c4",
      lineHeight: 1.4
    },
    confirmDeleteRed: {
      flex: 1,
      background: "#8B2020",
      color: "#fff",
      border: "none",
      borderRadius: "8px",
      padding: "10px",
      fontSize: "13px",
      fontWeight: 700,
      cursor: "pointer"
    },
    orderRegularStar: { color: "#c9a84c", fontSize: "15px" },
    // ── Regular discount toggle on order card ──────────────────────────────────
    regularDiscountToggle: {
      width: "100%",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      background: "#1a2e1a",
      border: "1px solid #3a6a3a",
      borderRadius: "9px",
      padding: "10px 12px",
      cursor: "pointer",
      marginBottom: "10px"
    },
    regularDiscountLabel: { fontSize: "13px", fontWeight: 600, color: "#c9a84c" },
    toggleSwitch: {
      width: "40px",
      height: "22px",
      borderRadius: "11px",
      background: "#37403c",
      position: "relative",
      transition: "background 0.15s",
      flexShrink: 0
    },
    toggleSwitchOn: { background: "#1D9E75" },
    toggleKnob: {
      position: "absolute",
      top: "2px",
      left: "2px",
      width: "18px",
      height: "18px",
      borderRadius: "9px",
      background: "#fff",
      transition: "left 0.15s"
    },
    toggleKnobOn: { left: "20px" },
    // ── Link regular prompt modal ──────────────────────────────────────────────
    linkPromptCard: {
      background: "#232a28",
      border: "1px solid #2d6a6a",
      borderRadius: "14px",
      padding: "20px",
      maxWidth: "340px",
      width: "90%",
      margin: "auto"
    },
    linkPromptTitle: { fontSize: "16px", fontWeight: 700, color: "#c9a84c", marginBottom: "8px" },
    linkPromptBody: { fontSize: "13px", color: "#d8d2c4", lineHeight: 1.4, marginBottom: "14px" },
    linkPromptList: { display: "flex", flexDirection: "column", gap: "8px", marginBottom: "12px" },
    linkPromptCandidate: {
      display: "flex",
      flexDirection: "column",
      alignItems: "flex-start",
      background: "#1a3a3a",
      border: "1px solid #2d6a6a",
      borderRadius: "9px",
      padding: "11px 13px",
      cursor: "pointer"
    },
    linkPromptCandidateName: { fontSize: "14px", fontWeight: 700, color: "#f2f2f0" },
    linkPromptCandidateMeta: { fontSize: "11px", color: "#c9a84c", marginTop: "2px" },
    linkPromptSkip: {
      width: "100%",
      background: "transparent",
      color: "#9aa5a0",
      border: "1px solid #37403c",
      borderRadius: "8px",
      padding: "10px",
      fontSize: "13px",
      cursor: "pointer"
    },
    // ── Inventory tracker (Shop tab) ───────────────────────────────────────────
    inventorySection: {
      background: "#232a28",
      border: "1px solid #2d3a36",
      borderRadius: "12px",
      padding: "14px",
      marginTop: "14px"
    },
    inventoryTitle: {
      fontSize: "14px",
      fontWeight: 700,
      color: "#c9a84c",
      marginBottom: "4px"
    },
    inventoryHint: {
      fontSize: "11px",
      color: "#9aa5a0",
      fontStyle: "italic",
      marginBottom: "12px",
      lineHeight: 1.4
    },
    inventoryGroup: { marginBottom: "14px" },
    inventoryGroupLabel: {
      fontSize: "11px",
      fontWeight: 700,
      color: "#8a928c",
      textTransform: "uppercase",
      letterSpacing: "0.5px",
      marginBottom: "6px"
    },
    inventoryRow: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "8px 0",
      borderBottom: "1px solid #2d3a36"
    },
    inventoryName: { fontSize: "13px", color: "#e8e2d4", flex: 1 },
    inventoryControls: { display: "flex", alignItems: "center", gap: "10px" },
    inventoryBtn: {
      width: "30px",
      height: "30px",
      borderRadius: "8px",
      border: "1px solid #37403c",
      background: "#1a1a1a",
      color: "#e8e2d4",
      fontSize: "18px",
      fontWeight: 700,
      cursor: "pointer",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      lineHeight: 1
    },
    inventoryCount: {
      minWidth: "34px",
      textAlign: "center",
      fontSize: "16px",
      fontWeight: 700,
      color: "#f2f2f0"
    },
    inventoryCountYellow: { color: "#EF9F27" },
    inventoryCountRed: { color: "#E8799A" },
    // Strikethrough applied to the button label text only (keeps the icon intact).
    struckText: {
      textDecoration: "line-through",
      textDecorationThickness: "2px"
    },
    pasteHint: {
      fontSize: "12px",
      color: "#9aa5a0",
      lineHeight: 1.5,
      marginBottom: "8px"
    },
    attachRow: {
      display: "flex",
      alignItems: "center",
      gap: "8px",
      marginTop: "8px",
      flexWrap: "wrap"
    },
    attachBtn: {
      display: "flex",
      alignItems: "center",
      gap: "6px",
      fontSize: "12px",
      fontWeight: 600,
      color: "#B5A2E8",
      background: "transparent",
      border: "1px solid #7F77DD",
      borderRadius: "8px",
      padding: "8px 12px",
      cursor: "pointer"
    },
    attachChip: {
      display: "flex",
      alignItems: "center",
      gap: "4px",
      background: "#1a1a1a",
      border: "1px solid #37403c",
      borderRadius: "8px",
      padding: "4px 4px 4px 10px"
    },
    attachName: {
      fontSize: "12px",
      color: CREAM,
      maxWidth: "140px",
      overflow: "hidden",
      textOverflow: "ellipsis",
      whiteSpace: "nowrap"
    },
    shopBulkRow: {
      display: "flex",
      alignItems: "center",
      gap: "10px",
      marginTop: "12px",
      flexWrap: "wrap"
    },
    parseError: {
      fontSize: "12px",
      color: "#F7C1C1",
      background: "#501313",
      borderRadius: "6px",
      padding: "8px 10px",
      marginTop: "8px"
    },
    emptyState: {
      textAlign: "center",
      padding: "48px 20px",
      color: "#9aa5a0"
    },
    emptyTitle: {
      fontSize: "16px",
      fontWeight: 600,
      color: CREAM,
      marginBottom: "6px"
    },
    emptyBody: {
      fontSize: "13px",
      lineHeight: 1.5
    },
    orderList: {
      display: "flex",
      flexDirection: "column",
      gap: "10px"
    },
    orderCard: {
      background: CARD,
      border: "1px solid #37403c",
      borderRadius: "10px",
      overflow: "hidden"
    },
    orderCardHeader: {
      width: "100%",
      padding: "14px",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      cursor: "pointer",
      color: CREAM,
      textAlign: "left"
    },
    orderCardLeft: {
      display: "flex",
      flexDirection: "column",
      gap: "3px",
      minWidth: 0
    },
    orderCustomer: {
      fontSize: "15px",
      fontWeight: 600
    },
    orderMeta: {
      fontSize: "12px",
      color: "#9aa5a0"
    },
    orderCardRight: {
      display: "flex",
      alignItems: "center",
      gap: "8px",
      flexShrink: 0
    },
    paidPill: {
      fontSize: "11px",
      fontWeight: 700,
      padding: "4px 10px",
      borderRadius: "12px",
      cursor: "pointer",
      border: "none"
    },
    statusPill: {
      fontSize: "11px",
      fontWeight: 700,
      padding: "4px 10px",
      borderRadius: "12px",
      cursor: "pointer",
      border: "none"
    },
    orderCardBody: {
      padding: "0 14px 14px",
      borderTop: "1px solid #37403c"
    },
    orderItemsList: {
      padding: "12px 0 4px",
      display: "flex",
      flexDirection: "column",
      gap: "6px"
    },
    orderItemLine: {
      display: "flex",
      justifyContent: "space-between",
      fontSize: "13px",
      color: CREAM,
      gap: "10px"
    },
    orderItemVariant: {
      color: "#9aa5a0",
      fontSize: "12px"
    },
    loopSummary: {
      display: "flex",
      flexDirection: "column",
      gap: "2px",
      fontSize: "12px",
      color: TEAL_LIGHT,
      padding: "8px 0",
      borderTop: "1px dashed #37403c",
      marginTop: "4px"
    },
    notesBlock: {
      borderTop: "1px dashed #37403c",
      marginTop: "4px",
      paddingTop: "8px"
    },
    orderNotes: {
      fontSize: "12px",
      color: "#cccccc",
      fontStyle: "italic",
      cursor: "pointer",
      lineHeight: 1.5
    },
    notesEditHint: {
      color: "#7a8480",
      fontSize: "11px"
    },
    addNoteBtn: {
      display: "flex",
      alignItems: "center",
      gap: "5px",
      fontSize: "12px",
      fontWeight: 600,
      color: "#9aa5a0",
      background: "transparent",
      border: "none",
      cursor: "pointer",
      padding: "2px 0"
    },
    notesEditActions: {
      display: "flex",
      gap: "8px",
      marginTop: "6px"
    },
    orderCardFooter: {
      marginTop: "10px"
    },
    statusRow: {
      display: "flex",
      gap: "6px",
      flexWrap: "wrap",
      marginBottom: "10px"
    },
    statusOption: {
      flex: "1 1 auto",
      fontSize: "12px",
      fontWeight: 600,
      padding: "7px 10px",
      borderRadius: "8px",
      border: "1px solid #37403c",
      background: "transparent",
      color: "#9aa5a0",
      cursor: "pointer"
    },
    actionRow: {
      display: "flex",
      alignItems: "center",
      gap: "14px",
      flexWrap: "wrap"
    },
    actionBtn: {
      display: "flex",
      alignItems: "center",
      gap: "6px",
      fontSize: "12px",
      fontWeight: 600,
      color: TEAL_LIGHT,
      background: "transparent",
      border: "none",
      cursor: "pointer",
      padding: "4px 0"
    },
    confirmRow: {
      display: "flex",
      alignItems: "center",
      gap: "8px",
      fontSize: "12px"
    },
    confirmText: {
      color: "#cccccc",
      fontSize: "12px"
    },
    confirmYes: {
      background: "#993556",
      color: "#fff",
      border: "none",
      borderRadius: "6px",
      padding: "5px 10px",
      fontSize: "12px",
      fontWeight: 600,
      cursor: "pointer"
    },
    confirmYesGreen: {
      background: "#1D9E75",
      color: "#fff",
      border: "none",
      borderRadius: "6px",
      padding: "5px 10px",
      fontSize: "12px",
      fontWeight: 600,
      cursor: "pointer"
    },
    confirmNo: {
      background: "transparent",
      color: "#9aa5a0",
      border: "1px solid #37403c",
      borderRadius: "6px",
      padding: "5px 10px",
      fontSize: "12px",
      cursor: "pointer"
    },
    deliveredSection: {
      marginTop: "20px"
    },
    deliveredSummary: {
      fontSize: "13px",
      fontWeight: 600,
      color: "#9aa5a0",
      cursor: "pointer",
      padding: "8px 0"
    },
    clearDeliveredBtn: {
      display: "flex",
      alignItems: "center",
      gap: "6px",
      fontSize: "12px",
      fontWeight: 600,
      color: "#9aa5a0",
      background: "transparent",
      border: "1px dashed #37403c",
      borderRadius: "8px",
      padding: "10px 12px",
      cursor: "pointer",
      marginTop: "10px",
      width: "100%",
      justifyContent: "center"
    },
    clearConfirmRow: {
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: "8px",
      marginTop: "10px",
      flexWrap: "wrap"
    },
    // Form
    formCard: {
      background: CARD,
      border: `1px solid ${TEAL_MID}`,
      borderRadius: "10px",
      padding: "16px",
      marginBottom: "16px",
      display: "flex",
      flexDirection: "column",
      gap: "4px"
    },
    formHeader: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: "8px"
    },
    formTitle: {
      fontSize: "16px",
      fontWeight: 700,
      color: "#fff"
    },
    iconBtn: {
      background: "transparent",
      border: "none",
      color: "#9aa5a0",
      cursor: "pointer",
      padding: "4px"
    },
    label: {
      fontSize: "12px",
      fontWeight: 600,
      color: TEAL_LIGHT,
      marginTop: "10px",
      marginBottom: "4px"
    },
    input: {
      background: "#1a1a1a",
      border: "1px solid #37403c",
      borderRadius: "8px",
      padding: "10px 12px",
      fontSize: "14px",
      color: CREAM,
      outline: "none"
    },
    chipRow: {
      display: "flex",
      flexWrap: "wrap",
      gap: "6px",
      marginTop: "6px"
    },
    chip: {
      fontSize: "12px",
      fontWeight: 600,
      color: TEAL_LIGHT,
      background: "#0f2e2a",
      border: `1px solid ${TEAL_MID}`,
      borderRadius: "14px",
      padding: "5px 12px",
      cursor: "pointer"
    },
    textarea: {
      background: "#1a1a1a",
      border: "1px solid #37403c",
      borderRadius: "8px",
      padding: "10px 12px",
      fontSize: "14px",
      color: CREAM,
      outline: "none",
      minHeight: "60px",
      resize: "vertical",
      fontFamily: "inherit"
    },
    selectedSummary: {
      fontSize: "12px",
      color: TEAL_LIGHT,
      fontWeight: 600,
      marginBottom: "4px"
    },
    qtyControl: {
      display: "flex",
      alignItems: "center",
      gap: "8px"
    },
    qtyBtn: {
      width: "26px",
      height: "26px",
      borderRadius: "6px",
      border: "1px solid #37403c",
      background: "transparent",
      color: TEAL_LIGHT,
      fontSize: "16px",
      fontWeight: 700,
      cursor: "pointer",
      display: "flex",
      alignItems: "center",
      justifyContent: "center"
    },
    qtyValue: {
      fontSize: "14px",
      fontWeight: 600,
      minWidth: "16px",
      textAlign: "center"
    },
    categoryGrid: {
      display: "flex",
      flexWrap: "wrap",
      gap: "6px",
      marginTop: "6px"
    },
    categoryBtn: {
      fontSize: "12px",
      fontWeight: 600,
      color: "#cccccc",
      background: "#1a1a1a",
      border: "1px solid #37403c",
      borderRadius: "8px",
      padding: "8px 10px",
      cursor: "pointer",
      display: "flex",
      alignItems: "center",
      gap: "4px"
    },
    categoryBtnActive: {
      color: TEAL_LIGHT,
      borderColor: TEAL_LIGHT,
      background: "#0f2e2a"
    },
    catCount: {
      background: GOLD,
      color: "#1a1a1a",
      borderRadius: "8px",
      fontSize: "10px",
      fontWeight: 700,
      padding: "1px 6px"
    },
    picker: {
      background: "#1a1a1a",
      border: "1px solid #37403c",
      borderRadius: "8px",
      padding: "10px",
      marginTop: "8px",
      display: "flex",
      flexDirection: "column",
      gap: "10px"
    },
    pickerGroup: {
      display: "flex",
      flexDirection: "column",
      gap: "4px"
    },
    pickerGroupName: {
      fontSize: "12px",
      fontWeight: 700,
      color: "#fff"
    },
    pickerVariants: {
      display: "flex",
      flexDirection: "column",
      gap: "4px"
    },
    variantBtn: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      background: "transparent",
      border: "1px solid #37403c",
      borderRadius: "6px",
      padding: "8px 10px",
      fontSize: "12px",
      color: CREAM,
      cursor: "pointer",
      textAlign: "left",
      minHeight: "38px"
    },
    variantBtnSelected: {
      borderColor: TEAL_LIGHT,
      background: "#0f2e2a"
    },
    variantLabel: {
      color: CREAM,
      flex: 1,
      paddingRight: "8px"
    },
    variantPrice: {
      color: GOLD,
      fontWeight: 700
    },
    reviewList: {
      display: "flex",
      flexDirection: "column",
      gap: "6px",
      marginTop: "10px",
      paddingTop: "10px",
      borderTop: "1px dashed #37403c"
    },
    reviewRow: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: "10px"
    },
    reviewText: {
      fontSize: "13px",
      color: CREAM,
      flex: 1
    },
    loopRow: {
      display: "flex",
      gap: "12px",
      marginTop: "4px"
    },
    loopField: {
      flex: 1,
      display: "flex",
      flexDirection: "column"
    },
    loopHint: {
      fontSize: "11px",
      color: "#9aa5a0",
      marginTop: "4px"
    },
    discountRow: {
      display: "flex",
      gap: "6px",
      alignItems: "stretch"
    },
    discountTypeBtn: {
      fontSize: "13px",
      fontWeight: 700,
      color: "#9aa5a0",
      background: "#1a1a1a",
      border: "1px solid #37403c",
      borderRadius: "8px",
      padding: "8px 14px",
      cursor: "pointer"
    },
    discountTypeBtnActive: {
      color: "#E8799A",
      borderColor: "#E8799A",
      background: "#2e1a22"
    },
    discountLine: {
      display: "flex",
      justifyContent: "space-between",
      fontSize: "13px",
      color: "#E8799A",
      fontWeight: 600,
      marginTop: "12px"
    },
    totalRow: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      fontSize: "14px",
      fontWeight: 600,
      color: CREAM,
      marginTop: "8px",
      paddingTop: "10px",
      borderTop: `1px solid ${TEAL_MID}`
    },
    waiveSurchargeRow: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      width: "100%",
      background: "transparent",
      border: "none",
      cursor: "pointer",
      padding: "8px 0 2px",
      marginTop: "4px"
    },
    waiveSurchargeLabel: {
      display: "flex",
      alignItems: "center",
      gap: "8px",
      fontSize: "13px",
      color: "#9aa5a0"
    },
    waiveCheckbox: {
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      width: "18px",
      height: "18px",
      borderRadius: "4px",
      border: "1px solid #4a5450",
      background: "#1a1a1a",
      color: "#0c1410",
      flexShrink: 0
    },
    waiveCheckboxOn: {
      background: TEAL_LIGHT,
      borderColor: TEAL_LIGHT
    },
    waiveSurchargeHint: {
      fontSize: "11px",
      color: "#7a8480",
      fontStyle: "italic"
    },
    negativeTotalNote: {
      fontSize: "12px",
      color: "#E8799A",
      background: "#2a1419",
      border: "1px solid #5a2433",
      borderRadius: "8px",
      padding: "8px 12px",
      marginTop: "8px",
      lineHeight: 1.4
    },
    totalValue: {
      fontSize: "18px",
      fontWeight: 700,
      color: GOLD
    },
    saveBtn: {
      marginTop: "12px",
      background: TEAL_LIGHT,
      color: "#04342C",
      border: "none",
      borderRadius: "8px",
      padding: "12px",
      fontSize: "14px",
      fontWeight: 700,
      cursor: "pointer"
    },
    saveBtnDisabled: {
      opacity: 0.4,
      cursor: "not-allowed"
    },
    // Cooking list
    cookHeader: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: "12px"
    },
    cookSummary: {
      fontSize: "12px",
      color: "#9aa5a0"
    },
    resetBtn: {
      display: "flex",
      alignItems: "center",
      gap: "5px",
      fontSize: "12px",
      fontWeight: 600,
      color: "#9aa5a0",
      background: "transparent",
      border: "1px solid #37403c",
      borderRadius: "6px",
      padding: "5px 10px",
      cursor: "pointer"
    },
    cookCategory: {
      marginBottom: "16px"
    },
    cookCategoryTitle: {
      fontSize: "13px",
      fontWeight: 700,
      color: TEAL_LIGHT,
      marginBottom: "6px",
      textTransform: "uppercase",
      letterSpacing: "0.05em"
    },
    cookItem: {
      width: "100%",
      display: "flex",
      alignItems: "center",
      gap: "10px",
      background: CARD,
      border: "1px solid #37403c",
      borderRadius: "8px",
      padding: "10px 12px",
      marginBottom: "6px",
      cursor: "pointer",
      textAlign: "left"
    },
    cookItemChecked: {
      opacity: 0.5
    },
    checkbox: {
      width: "18px",
      height: "18px",
      borderRadius: "5px",
      border: "1.5px solid #5F5E5A",
      flexShrink: 0,
      display: "flex",
      alignItems: "center",
      justifyContent: "center"
    },
    checkboxChecked: {
      background: TEAL_LIGHT,
      borderColor: TEAL_LIGHT
    },
    cookItemText: {
      flex: 1
    },
    cookItemName: {
      fontSize: "14px",
      fontWeight: 600,
      color: CREAM
    },
    cookItemVariant: {
      fontSize: "12px",
      color: "#9aa5a0"
    },
    cookItemQty: {
      fontSize: "14px",
      fontWeight: 700,
      color: GOLD
    },
    // Shopping list
    genCard: {
      background: CARD,
      border: `1px solid ${TEAL_MID}`,
      borderRadius: "10px",
      padding: "14px",
      marginBottom: "14px"
    },
    genTitle: {
      fontSize: "14px",
      fontWeight: 700,
      color: "#fff",
      marginBottom: "4px"
    },
    genHint: {
      fontSize: "12px",
      color: "#9aa5a0",
      lineHeight: 1.5,
      marginBottom: "8px"
    },
    genToggleRow: {
      display: "flex",
      alignItems: "center",
      gap: "8px",
      fontSize: "12px",
      color: CREAM,
      cursor: "pointer"
    },
    genCheckbox: {
      width: "16px",
      height: "16px",
      accentColor: TEAL_LIGHT
    },
    shopInputRow: {
      display: "flex",
      gap: "8px",
      marginBottom: "14px",
      alignItems: "flex-start"
    },
    shopAddBtn: {
      background: TEAL_LIGHT,
      color: "#04342C",
      border: "none",
      borderRadius: "8px",
      width: "44px",
      height: "44px",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      cursor: "pointer",
      flexShrink: 0
    },
    shopItem: {
      display: "flex",
      alignItems: "center",
      background: CARD,
      border: "1px solid #37403c",
      borderRadius: "8px",
      marginBottom: "6px",
      overflow: "hidden"
    },
    shopItemMain: {
      flex: 1,
      display: "flex",
      alignItems: "center",
      gap: "10px",
      background: "transparent",
      border: "none",
      padding: "11px 12px",
      cursor: "pointer",
      textAlign: "left"
    },
    shopItemText: {
      fontSize: "14px",
      color: CREAM
    },
    shopItemTextChecked: {
      textDecoration: "line-through",
      color: "#9aa5a0"
    },
    shopDeleteBtn: {
      background: "transparent",
      border: "none",
      color: "#5F5E5A",
      cursor: "pointer",
      padding: "11px 12px",
      flexShrink: 0
    },
    // Money tab
    moneyStatsBar: {
      display: "flex",
      flexWrap: "wrap",
      gap: "8px",
      marginBottom: "8px"
    },
    moneyStatTile: {
      flex: "1 1 45%",
      background: CARD,
      border: "1px solid #37403c",
      borderRadius: "10px",
      padding: "10px 8px",
      textAlign: "center"
    },
    moneyFootnote: {
      fontSize: "10px",
      color: "#7a8480",
      fontStyle: "italic",
      marginBottom: "8px"
    },
    groupLabel: {
      fontSize: "12px",
      color: "#9aa5a0",
      fontWeight: 600
    },
    moneyGroup: {
      marginBottom: "14px"
    },
    groupHeader: {
      display: "flex",
      alignItems: "baseline",
      justifyContent: "space-between",
      gap: "8px",
      padding: "4px 2px 6px",
      flexWrap: "wrap"
    },
    groupTitle: {
      fontSize: "13px",
      fontWeight: 700,
      color: TEAL_LIGHT,
      textTransform: "uppercase",
      letterSpacing: "0.04em"
    },
    groupTotals: {
      fontSize: "11px",
      color: "#9aa5a0"
    },
    moneyAmounts: {
      display: "flex",
      flexDirection: "column",
      alignItems: "flex-end"
    },
    moneyProfit: {
      fontSize: "11px",
      fontWeight: 600,
      color: "#1D9E75"
    },
    sortRow: {
      display: "flex",
      alignItems: "center",
      gap: "6px",
      marginBottom: "12px",
      flexWrap: "wrap"
    },
    sortBtn: {
      display: "flex",
      alignItems: "center",
      gap: "4px",
      fontSize: "12px",
      fontWeight: 600,
      color: "#9aa5a0",
      background: "transparent",
      border: "1px solid #37403c",
      borderRadius: "8px",
      padding: "6px 10px",
      cursor: "pointer"
    },
    sortBtnActive: {
      color: TEAL_LIGHT,
      borderColor: TEAL_LIGHT
    },
    sortDirText: {
      fontSize: "11px"
    },
    moneyCount: {
      marginLeft: "auto",
      fontSize: "12px",
      color: "#9aa5a0"
    },
    moneyList: {
      display: "flex",
      flexDirection: "column",
      gap: "6px"
    },
    moneyRow: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      background: CARD,
      border: "1px solid #37403c",
      borderRadius: "8px",
      padding: "10px 12px",
      gap: "10px"
    },
    moneyRowLeft: {
      minWidth: 0
    },
    moneyName: {
      fontSize: "14px",
      fontWeight: 600,
      color: CREAM
    },
    moneyMeta: {
      fontSize: "11px",
      color: "#9aa5a0",
      marginTop: "2px"
    },
    moneyRowRight: {
      display: "flex",
      alignItems: "center",
      gap: "10px",
      flexShrink: 0
    },
    moneyAmount: {
      fontSize: "14px",
      fontWeight: 700,
      color: GOLD
    },
    // Review banner (AI flags)
    // Per-item editor
    reviewItemCard: {
      background: "#1a1a1a",
      border: "1px solid #37403c",
      borderRadius: "8px",
      padding: "8px 10px",
      marginBottom: "6px"
    },
    reviewItemMain: {
      flex: 1,
      background: "transparent",
      border: "none",
      textAlign: "left",
      cursor: "pointer",
      display: "flex",
      alignItems: "center",
      gap: "6px",
      padding: 0
    },
    itemExtraDot: {
      width: "6px",
      height: "6px",
      borderRadius: "50%",
      background: TEAL_LIGHT,
      flexShrink: 0
    },
    itemNotePreview: {
      fontSize: "11px",
      color: "#9aa5a0",
      fontStyle: "italic",
      marginTop: "3px"
    },
    itemUpchargePreview: {
      fontSize: "11px",
      color: TEAL_LIGHT,
      marginTop: "3px"
    },
    itemUpchargeNeedsPrice: {
      fontSize: "11px",
      color: "#EF9F27",
      marginTop: "3px",
      fontWeight: 600
    },
    itemEditor: {
      marginTop: "8px",
      paddingTop: "8px",
      borderTop: "1px dashed #37403c"
    },
    miniLabel: {
      fontSize: "11px",
      fontWeight: 600,
      color: "#9aa5a0",
      display: "block",
      marginTop: "6px",
      marginBottom: "3px"
    },
    upchargeRow: {
      display: "flex",
      gap: "6px"
    },
    itemEditorActions: {
      display: "flex",
      justifyContent: "flex-end",
      gap: "8px",
      marginTop: "8px"
    },
    clearItemExtra: {
      background: "transparent",
      color: "#993556",
      border: "none",
      fontSize: "12px",
      fontWeight: 600,
      cursor: "pointer"
    },
    doneItemBtn: {
      background: TEAL_LIGHT,
      color: "#04342C",
      border: "none",
      borderRadius: "6px",
      padding: "5px 14px",
      fontSize: "12px",
      fontWeight: 700,
      cursor: "pointer"
    },
    // Custom charges
    customChargeList: {
      display: "flex",
      flexDirection: "column",
      gap: "6px",
      marginBottom: "6px"
    },
    customChargeRow: {
      display: "flex",
      gap: "6px",
      alignItems: "center"
    },
    addChargeBtn: {
      display: "flex",
      alignItems: "center",
      gap: "6px",
      fontSize: "12px",
      fontWeight: 600,
      color: TEAL_LIGHT,
      background: "transparent",
      border: "1px dashed #2E6B6B",
      borderRadius: "8px",
      padding: "8px 12px",
      cursor: "pointer",
      marginTop: "2px"
    },
    extraLine: {
      display: "flex",
      justifyContent: "space-between",
      fontSize: "13px",
      color: "#cccccc",
      marginTop: "10px"
    },
    // Order card per-item sub-lines
    orderItemBlock: {
      display: "flex",
      flexDirection: "column",
      gap: "2px"
    },
    orderItemSub: {
      fontSize: "11px",
      color: TEAL_LIGHT,
      paddingLeft: "2px"
    },
    orderItemNote: {
      fontSize: "11px",
      color: "#9aa5a0",
      fontStyle: "italic",
      paddingLeft: "2px"
    },
    // Invoice
    invoiceOverlay: {
      position: "fixed",
      inset: 0,
      background: "rgba(0,0,0,0.75)",
      display: "flex",
      alignItems: "flex-start",
      justifyContent: "center",
      padding: "20px 12px",
      zIndex: 100,
      overflowY: "auto"
    },
    invoiceScroll: {
      width: "100%",
      maxWidth: "380px",
      display: "flex",
      flexDirection: "column",
      alignItems: "center"
    },
    invoiceCard: {
      width: "100%",
      background: "linear-gradient(160deg, #14302e 0%, #1a1a1a 55%)",
      border: `1px solid ${GOLD}`,
      borderRadius: "16px",
      padding: "20px",
      boxSizing: "border-box"
    },
    invoiceHeader: {
      display: "flex",
      alignItems: "center",
      gap: "10px",
      marginBottom: "14px"
    },
    invoiceLogo: {
      width: "44px",
      height: "44px",
      borderRadius: "50%",
      background: "#085041",
      border: `2px solid ${TEAL_LIGHT}`,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: "14px",
      fontWeight: 700,
      color: TEAL_LIGHT,
      flexShrink: 0
    },
    invoiceBrand: {
      fontSize: "15px",
      fontWeight: 700,
      color: "#fff"
    },
    invoiceTagline: {
      fontSize: "11px",
      color: TEAL_LIGHT,
      fontStyle: "italic"
    },
    invoiceMeta: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "baseline",
      gap: "8px"
    },
    invoiceCustomer: {
      fontSize: "17px",
      fontWeight: 700,
      color: CREAM
    },
    invoiceDate: {
      fontSize: "12px",
      color: "#9aa5a0"
    },
    invoiceDivider: {
      height: "1px",
      background: "#37403c",
      margin: "12px 0"
    },
    invoiceItems: {
      display: "flex",
      flexDirection: "column",
      gap: "10px"
    },
    invoiceItemBlock: {
      display: "flex",
      flexDirection: "column",
      gap: "1px"
    },
    invoiceItemLine: {
      display: "flex",
      justifyContent: "space-between",
      gap: "10px"
    },
    invoiceItemName: {
      fontSize: "14px",
      fontWeight: 600,
      color: CREAM
    },
    invoiceItemPrice: {
      fontSize: "14px",
      fontWeight: 700,
      color: CREAM,
      flexShrink: 0
    },
    invoiceItemVariant: {
      fontSize: "12px",
      color: "#9aa5a0"
    },
    invoiceItemExtra: {
      fontSize: "11px",
      color: TEAL_LIGHT
    },
    invoiceItemNote: {
      fontSize: "11px",
      color: "#b8a06a",
      fontStyle: "italic"
    },
    invoiceTotals: {
      display: "flex",
      flexDirection: "column",
      gap: "5px"
    },
    invoiceTotalRow: {
      display: "flex",
      justifyContent: "space-between",
      fontSize: "13px",
      color: "#cccccc"
    },
    invoiceGrandTotal: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      marginTop: "12px",
      paddingTop: "12px",
      borderTop: `1px solid ${GOLD}`
    },
    invoiceGrandValue: {
      fontSize: "22px",
      fontWeight: 700,
      color: GOLD
    },
    invoiceNotes: {
      fontSize: "12px",
      color: "#9aa5a0",
      fontStyle: "italic",
      marginTop: "12px",
      paddingTop: "10px",
      borderTop: "1px dashed #37403c"
    },
    invoiceFooter: {
      fontSize: "11px",
      color: TEAL_LIGHT,
      textAlign: "center",
      marginTop: "14px"
    },
    invoiceClose: {
      marginTop: "16px",
      background: TEAL_LIGHT,
      color: "#04342C",
      border: "none",
      borderRadius: "10px",
      padding: "12px 40px",
      fontSize: "14px",
      fontWeight: 700,
      cursor: "pointer"
    },
    invoiceHint: {
      fontSize: "12px",
      color: "#9aa5a0",
      marginTop: "8px",
      textAlign: "center"
    },
    // Review open button (replaces passive banner)
    reviewOpenBtn: {
      display: "flex",
      alignItems: "center",
      gap: "10px",
      width: "100%",
      background: "#3a2e08",
      border: "1px solid #C49A3C",
      borderRadius: "10px",
      padding: "12px 14px",
      cursor: "pointer",
      marginBottom: "10px",
      color: GOLD,
      textAlign: "left"
    },
    reviewOpenText: { flex: 1 },
    reviewOpenTitle: { fontSize: "13px", fontWeight: 700, color: GOLD },
    reviewOpenSub: { fontSize: "11px", color: "#cbb87a", marginTop: "1px" },
    // Review modal
    reviewModalCard: {
      width: "100%",
      maxWidth: "420px",
      background: CARD,
      border: `1px solid ${TEAL_MID}`,
      borderRadius: "14px",
      padding: "18px",
      boxSizing: "border-box"
    },
    reviewModalHeader: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: "4px"
    },
    reviewModalTitle: { fontSize: "17px", fontWeight: 700, color: "#fff" },
    reviewProgress: { fontSize: "12px", color: "#9aa5a0", marginBottom: "14px" },
    reviewStep: { display: "flex", flexDirection: "column" },
    reviewReasonBox: {
      background: "#1a1a1a",
      border: "1px solid #C49A3C",
      borderRadius: "8px",
      padding: "12px",
      fontSize: "14px",
      color: CREAM,
      lineHeight: 1.4
    },
    reviewItemContext: {
      fontSize: "12px",
      color: "#9aa5a0",
      marginTop: "8px"
    },
    reviewField: {
      display: "flex",
      flexDirection: "column",
      marginTop: "12px"
    },
    reviewActionBtn: {
      marginTop: "8px",
      alignSelf: "flex-start",
      background: TEAL_LIGHT,
      color: "#04342C",
      border: "none",
      borderRadius: "8px",
      padding: "8px 16px",
      fontSize: "13px",
      fontWeight: 700,
      cursor: "pointer"
    },
    reviewOr: {
      fontSize: "11px",
      color: "#7a8480",
      textAlign: "center",
      margin: "10px 0 4px",
      textTransform: "uppercase",
      letterSpacing: "0.08em"
    },
    reviewSkipBtn: {
      marginTop: "14px",
      background: "transparent",
      color: "#9aa5a0",
      border: "1px solid #37403c",
      borderRadius: "8px",
      padding: "9px",
      fontSize: "12px",
      fontWeight: 600,
      cursor: "pointer"
    },
    reviewNav: {
      display: "flex",
      justifyContent: "center",
      gap: "6px",
      marginTop: "14px"
    },
    reviewDot: {
      width: "8px",
      height: "8px",
      borderRadius: "50%",
      border: "none",
      background: "#37403c",
      cursor: "pointer",
      padding: 0
    },
    reviewDotActive: { background: TEAL_LIGHT },
    reviewDotDone: { background: "#1D9E75" },
    reviewDone: {
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      gap: "10px",
      padding: "24px 0 8px",
      textAlign: "center"
    },
    reviewDoneText: { fontSize: "14px", color: CREAM, fontWeight: 600 },
    // Sous vide reprice button
    sousVideBtn: {
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: "8px",
      width: "100%",
      marginTop: "12px",
      background: "#0f2e2a",
      color: TEAL_LIGHT,
      border: `1px solid ${TEAL_MID}`,
      borderRadius: "8px",
      padding: "11px",
      fontSize: "13px",
      fontWeight: 600,
      cursor: "pointer"
    },
    weightPriceHint: {
      fontSize: "12px",
      color: TEAL_LIGHT,
      marginTop: "4px",
      fontWeight: 600
    },
    // Pending weight state on order cards
    pendingPrice: {
      fontSize: "12px",
      color: "#EF9F27",
      fontStyle: "italic",
      fontWeight: 600
    },
    setWeightBtn: {
      display: "inline-flex",
      alignItems: "center",
      gap: "5px",
      marginTop: "5px",
      background: "#0f2e2a",
      color: TEAL_LIGHT,
      border: `1px solid ${TEAL_MID}`,
      borderRadius: "6px",
      padding: "5px 10px",
      fontSize: "11px",
      fontWeight: 600,
      cursor: "pointer"
    },
    updateAllWeightsBtn: {
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: "8px",
      width: "100%",
      marginBottom: "10px",
      background: "#0f2e2a",
      color: TEAL_LIGHT,
      border: `1px solid ${TEAL_MID}`,
      borderRadius: "8px",
      padding: "11px",
      fontSize: "13px",
      fontWeight: 600,
      cursor: "pointer"
    },
    // Weight + photo modal
    weightModalCard: {
      width: "100%",
      maxWidth: "400px",
      background: CARD,
      border: `1px solid ${TEAL_MID}`,
      borderRadius: "14px",
      padding: "18px",
      boxSizing: "border-box",
      maxHeight: "88vh",
      overflowY: "auto"
    },
    weightStepLabel: {
      fontSize: "11px",
      color: TEAL_LIGHT,
      marginTop: "2px"
    },
    amendBtn: {
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: "7px",
      flex: "1 1 100%",
      background: "#2a2333",
      color: "#b89adb",
      border: "1px solid #6b51a0",
      borderRadius: "10px",
      padding: "13px",
      fontSize: "14px",
      fontWeight: 600,
      cursor: "pointer"
    },
    amendOrderPicker: {
      display: "flex",
      flexDirection: "column",
      gap: "6px",
      marginBottom: "4px"
    },
    amendOrderChip: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: "10px",
      background: "#1a1a1a",
      border: "1px solid #37403c",
      borderRadius: "8px",
      padding: "10px 12px",
      cursor: "pointer",
      textAlign: "left",
      width: "100%"
    },
    amendOrderChipActive: {
      borderColor: TEAL_LIGHT,
      background: "#0f2e2a"
    },
    amendChipName: {
      fontSize: "14px",
      fontWeight: 600,
      color: CREAM
    },
    amendChipMeta: {
      fontSize: "12px",
      color: "#9aa5a0",
      flexShrink: 0
    },
    amendCurrentBox: {
      background: "#14302e",
      border: `1px solid ${TEAL_MID}`,
      borderRadius: "8px",
      padding: "10px 12px",
      margin: "4px 0 4px"
    },
    amendCurrentTitle: {
      fontSize: "11px",
      fontWeight: 700,
      color: TEAL_LIGHT,
      textTransform: "uppercase",
      letterSpacing: "0.05em",
      marginBottom: "6px"
    },
    amendCurrentItem: {
      fontSize: "13px",
      color: CREAM,
      padding: "2px 0"
    },
    weightDeferNote: {
      fontSize: "12px",
      color: "#9aa5a0",
      background: "#0f2e2a",
      border: `1px solid ${TEAL_MID}`,
      borderRadius: "8px",
      padding: "10px 12px",
      margin: "10px 0 0",
      lineHeight: 1.4
    },
    weightIntentNote: {
      fontSize: "12px",
      color: "#9aa5a0",
      fontStyle: "italic",
      background: "#1a1a1a",
      borderRadius: "6px",
      padding: "8px 10px",
      margin: "4px 0 12px"
    },
    weightModalHint: {
      fontSize: "11px",
      color: "#7a8480",
      marginTop: "8px",
      lineHeight: 1.4
    },
    photoUploadBtn: {
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: "8px",
      width: "100%",
      background: "#1a1a1a",
      color: TEAL_LIGHT,
      border: "1px dashed #2E6B6B",
      borderRadius: "8px",
      padding: "14px",
      fontSize: "13px",
      fontWeight: 600,
      cursor: "pointer",
      boxSizing: "border-box"
    },
    photoPreviewWrap: {
      position: "relative",
      borderRadius: "8px",
      overflow: "hidden",
      border: "1px solid #37403c"
    },
    photoPreview: {
      width: "100%",
      display: "block",
      maxHeight: "260px",
      objectFit: "contain",
      background: "#000"
    },
    photoRemoveBtn: {
      position: "absolute",
      top: "8px",
      right: "8px",
      display: "inline-flex",
      alignItems: "center",
      gap: "4px",
      background: "rgba(0,0,0,0.7)",
      color: "#fff",
      border: "none",
      borderRadius: "6px",
      padding: "5px 9px",
      fontSize: "11px",
      fontWeight: 600,
      cursor: "pointer"
    },
    // Storage gauge in Money tab
    storageGauge: {
      display: "flex",
      alignItems: "center",
      gap: "8px",
      fontSize: "12px",
      color: "#9aa5a0",
      padding: "12px 14px",
      marginTop: "8px",
      background: CARD,
      borderRadius: "8px",
      flexWrap: "wrap"
    },
    storageGaugeNote: {
      fontSize: "11px",
      color: "#7a8480",
      marginLeft: "auto"
    },
    // Order photos in Money tab
    moneyRowWrap: {
      display: "flex",
      flexDirection: "column"
    },
    orderPhotosWrap: {
      display: "flex",
      flexDirection: "column",
      gap: "10px",
      padding: "10px 4px 4px"
    },
    orderPhotoItem: {
      display: "flex",
      flexDirection: "column",
      gap: "5px"
    },
    orderPhotoLabel: {
      fontSize: "12px",
      fontWeight: 600,
      color: TEAL_LIGHT
    },
    orderPhotoLoading: {
      fontSize: "11px",
      color: "#7a8480",
      fontStyle: "italic"
    },
    orderPhotoImg: {
      width: "100%",
      borderRadius: "8px",
      border: "1px solid #37403c",
      maxHeight: "320px",
      objectFit: "contain",
      background: "#000"
    },
    // Cook tab revenue bar
    cookRevenueBar: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      background: "#0f2e2a",
      border: `1px solid ${TEAL_MID}`,
      borderRadius: "10px",
      padding: "12px 14px",
      marginBottom: "12px"
    },
    cookRevenueLabel: {
      fontSize: "13px",
      color: "#9aa5a0"
    },
    cookRevenueValue: {
      fontSize: "18px",
      fontWeight: 700,
      color: TEAL_LIGHT
    },
    // Shop tab cost bar
    shopCostBar: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      background: "#1a1a1a",
      border: "1px solid #37403c",
      borderRadius: "10px",
      padding: "11px 14px",
      marginBottom: "12px"
    },
    shopCostLabel: {
      fontSize: "12px",
      color: "#9aa5a0"
    },
    shopCostValue: {
      fontSize: "16px",
      fontWeight: 700,
      color: GOLD
    },
    // Money tab search row
    moneySearchRow: {
      display: "flex",
      alignItems: "center",
      gap: "8px",
      marginBottom: "12px"
    },
    moneySearchInput: {
      flex: 1,
      background: "#1a1a1a",
      border: "1px solid #37403c",
      borderRadius: "8px",
      padding: "10px 12px",
      fontSize: "14px",
      color: CREAM,
      outline: "none"
    },
    moneySearchClear: {
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      width: "32px",
      height: "32px",
      background: "transparent",
      border: "1px solid #37403c",
      borderRadius: "8px",
      color: "#9aa5a0",
      cursor: "pointer",
      flexShrink: 0
    },
    chartToggleBtn: {
      background: "transparent",
      border: `1px solid ${TEAL_MID}`,
      borderRadius: "8px",
      padding: "8px 14px",
      fontSize: "13px",
      fontWeight: 600,
      color: TEAL_LIGHT,
      cursor: "pointer",
      flexShrink: 0
    },
    chartToggleBtnActive: {
      background: "#0f2e2a",
      borderColor: TEAL_LIGHT
    },
    // Rich per-group summary header
    groupHeaderRich: {
      background: "#14302e",
      border: `1px solid ${TEAL_MID}`,
      borderRadius: "10px",
      padding: "12px 14px",
      marginBottom: "8px"
    },
    groupHeaderTop: {
      display: "flex",
      alignItems: "baseline",
      justifyContent: "space-between",
      marginBottom: "10px"
    },
    groupOrderCount: {
      fontSize: "12px",
      color: "#9aa5a0"
    },
    groupStatsRow: {
      display: "flex",
      gap: "8px"
    },
    groupStat: {
      flex: 1,
      display: "flex",
      flexDirection: "column",
      gap: "2px"
    },
    groupStatValue: {
      fontSize: "15px",
      fontWeight: 700,
      color: CREAM
    },
    groupStatLabel: {
      fontSize: "10px",
      color: "#7a8480",
      textTransform: "uppercase",
      letterSpacing: "0.04em"
    },
    // Profit chart
    chartCard: {
      background: CARD,
      border: "1px solid #37403c",
      borderRadius: "12px",
      padding: "14px",
      marginBottom: "14px"
    },
    chartHeader: {
      display: "flex",
      alignItems: "baseline",
      justifyContent: "space-between",
      marginBottom: "8px"
    },
    chartTitle: {
      fontSize: "14px",
      fontWeight: 700,
      color: CREAM
    },
    chartSubtitle: {
      fontSize: "12px",
      color: "#9aa5a0"
    },
    chartSvg: {
      width: "100%",
      height: "auto",
      display: "block"
    },
    chartLegend: {
      fontSize: "11px",
      color: "#7a8480",
      marginTop: "8px",
      lineHeight: 1.4
    },
    // CSV import
    csvBtn: {
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: "7px",
      flex: "1 1 100%",
      background: "#1f2937",
      color: "#93b4d4",
      border: "1px solid #3d5a7a",
      borderRadius: "10px",
      padding: "13px",
      fontSize: "14px",
      fontWeight: 600,
      cursor: "pointer"
    },
    checkFormBtn: {
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: "7px",
      flex: "1 1 100%",
      background: "#1a2e1a",
      color: "#7abf7a",
      border: "1px solid #3a6a3a",
      borderRadius: "10px",
      padding: "13px",
      fontSize: "14px",
      fontWeight: 600,
      cursor: "pointer"
    },
    spinning: {
      animation: "spin 1s linear infinite"
    },
    csvProgress: {
      fontSize: "13px",
      color: TEAL_LIGHT,
      textAlign: "center",
      padding: "8px 0"
    },
    csvResultsList: {
      display: "flex",
      flexDirection: "column",
      gap: "6px",
      marginBottom: "12px",
      maxHeight: "320px",
      overflowY: "auto"
    },
    csvResultRow: {
      background: "#1a1a1a",
      border: "1px solid #37403c",
      borderRadius: "8px",
      padding: "10px 12px"
    },
    csvResultName: {
      fontSize: "14px",
      fontWeight: 600,
      color: CREAM,
      marginBottom: "3px"
    },
    csvResultItems: {
      fontSize: "12px",
      color: "#9aa5a0",
      lineHeight: 1.4
    },
    csvResultItem: {
      marginRight: "4px"
    },
    csvResultFlag: {
      color: "#EF9F27"
    },
    csvResultError: {
      fontSize: "12px",
      color: "#E8799A",
      fontStyle: "italic"
    },
    csvBackBtn: {
      width: "100%",
      background: "transparent",
      color: "#9aa5a0",
      border: "1px solid #37403c",
      borderRadius: "8px",
      padding: "10px",
      fontSize: "13px",
      fontWeight: 600,
      cursor: "pointer",
      marginTop: "8px"
    }
  };

  // entry.jsx
  import_client.default.createRoot(document.getElementById("root")).render(
    import_react2.default.createElement(LTBOrderTracker)
  );
})();
/*! Bundled license information:

react/cjs/react.production.js:
  (**
   * @license React
   * react.production.js
   *
   * Copyright (c) Meta Platforms, Inc. and affiliates.
   *
   * This source code is licensed under the MIT license found in the
   * LICENSE file in the root directory of this source tree.
   *)

scheduler/cjs/scheduler.production.js:
  (**
   * @license React
   * scheduler.production.js
   *
   * Copyright (c) Meta Platforms, Inc. and affiliates.
   *
   * This source code is licensed under the MIT license found in the
   * LICENSE file in the root directory of this source tree.
   *)

react-dom/cjs/react-dom.production.js:
  (**
   * @license React
   * react-dom.production.js
   *
   * Copyright (c) Meta Platforms, Inc. and affiliates.
   *
   * This source code is licensed under the MIT license found in the
   * LICENSE file in the root directory of this source tree.
   *)

react-dom/cjs/react-dom-client.production.js:
  (**
   * @license React
   * react-dom-client.production.js
   *
   * Copyright (c) Meta Platforms, Inc. and affiliates.
   *
   * This source code is licensed under the MIT license found in the
   * LICENSE file in the root directory of this source tree.
   *)
*/
