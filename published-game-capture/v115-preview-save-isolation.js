/* V115 preview-only save isolation. Production saves on the same GitHub Pages
 * origin are READ ONLY: never write/remove the unprefixed production key.
 * This file is loaded ONLY in /preview/v115-reference/, before game.js.
 */
(function () {
  'use strict';
  var originalGet = Storage.prototype.getItem;
  var originalSet = Storage.prototype.setItem;
  var originalRemove = Storage.prototype.removeItem;
  var prefix = 'rookie:v115-reference-sandbox:';
  function managed(key) {
    var s = String(key);
    return s.indexOf('rookie:') === 0 || s.indexOf('rookie-') === 0;
  }
  function keyName(key) { return prefix + String(key); }
  Storage.prototype.getItem = function (key) {
    if (this !== window.localStorage || !managed(key)) return originalGet.call(this, key);
    var isolated = keyName(key);
    var value = originalGet.call(this, isolated);
    // Copy the production save once into the experimental namespace,
    // never write the production save. Existing preview progress takes priority.
    if (value === null && (/^rookie:profile:v1:/.test(String(key)) ||
                           String(key) === 'rookie:active-player' ||
                           String(key) === 'rookie-harbor-city-save-v2')) {
      var originalValue = originalGet.call(this, key);
      if (originalValue !== null) {
        originalSet.call(this, isolated, originalValue);
        value = originalValue;
      }
    }
    return value;
  };
  Storage.prototype.setItem = function (key, value) {
    if (this !== window.localStorage || !managed(key)) return originalSet.call(this, key, value);
    return originalSet.call(this, keyName(key), value);
  };
  Storage.prototype.removeItem = function (key) {
    if (this !== window.localStorage || !managed(key)) return originalRemove.call(this, key);
    return originalRemove.call(this, keyName(key));
  };
  document.title = 'ROOKIE: Harbor City — V115 Reference City Preview';
  window.ROOKIE_V115_PREVIEW = { isolatedSaves:true, productionUntouched:true, referenceCity:true };
})();
