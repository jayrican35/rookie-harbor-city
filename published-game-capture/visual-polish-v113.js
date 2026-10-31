/* ROOKIE: Harbor City — V113 main-campaign visual polish (isolated, reversible).
 * Art-direction only. Does not alter positions, collision, speed, objectives,
 * save schema, camera, combat, Academy, or Zombie Outbreak.
 * Load after game.js so the existing character dispatchers remain authoritative.
 */
(function () {
  'use strict';
  var H = window.HARBOR;
  if (!H || typeof drawPerson !== 'function' || typeof drawPedFigure !== 'function') return;
  var enabled = true;
  var counters = { actors: 0, pedestrians: 0, roomTints: 0, pools: 0 };
  function campaign() {
    return enabled && typeof state !== 'undefined' && state &&
      state.map !== 'training' && state.map !== 'warehouse' &&
      !(H.academy && typeof H.academy.active === 'function' && H.academy.active());
  }
  function movementPhase(phase) {
    // Source art has only three walk poses. A calmer cadence prevents
    // frantic two-frame ping-pong without modifying movement physics.
    return Number.isFinite(phase) ? phase * 0.77 : phase;
  }
  function groundedBob(bob) {
    return Number.isFinite(bob) ? bob * 0.55 : bob;
  }
  var oldPerson = drawPerson;
  drawPerson = function (x,y,color,hat,name,dir,isPlayer,hideName,bob,phase) {
    if (!campaign()) return oldPerson.apply(this, arguments);
    counters.actors++;
    // Fine foot-anchor ellipse makes controlled player easier to track.
    if (isPlayer && typeof ctx !== 'undefined' && ctx) {
      ctx.save();
      ctx.beginPath();
      ctx.ellipse(x, y + 1, 19, 6, 0, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(236,211,145,.24)';
      ctx.lineWidth = 1.25;
      ctx.stroke();
      ctx.restore();
    }
    return oldPerson.call(this,x,y,color,hat,name,dir,isPlayer,hideName,groundedBob(bob),movementPhase(phase));
  };
  var oldPed = drawPedFigure;
  drawPedFigure = function (x,y,app,name,dir,bob,phase,showLabel) {
    if (!campaign()) return oldPed.apply(this, arguments);
    counters.pedestrians++;
    return oldPed.call(this,x,y,app,name,dir,groundedBob(bob),movementPhase(phase),showLabel);
  };
  // Restrained ambient tint distinguishes station areas without altering
  // furniture, collision geometry, or the precinct lighting engine.
  if (typeof drawRoom === 'function') {
    var oldRoom = drawRoom;
    var tintByRoom = {
      'LOBBY': 'rgba(244,207,145,.09)',
      'INTAKE': 'rgba(135,204,194,.06)',
      'EVIDENCE': 'rgba(127,176,222,.08)',
      'RECORDS': 'rgba(185,207,173,.07)',
      'OPERATIONS': 'rgba(206,220,241,.06)',
      'BRIEFING': 'rgba(208,188,232,.07)',
      'INTERVIEW': 'rgba(245,211,165,.07)'
    };
    drawRoom = function (r) {
      var result = oldRoom.apply(this, arguments);
      if (!campaign() || !state || state.map !== 'station' || !r || !tintByRoom[r.label]) return result;
      ctx.save();
      var band = Math.min(r.h * 0.28, 72);
      var g = ctx.createLinearGradient(0, r.y, 0, r.y + band);
      g.addColorStop(0, tintByRoom[r.label]);
      g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = g;
      ctx.fillRect(r.x + 4, r.y + 4, Math.max(0,r.w-8), band);
      ctx.restore();
      counters.roomTints++;
      return result;
    };
  }
  // Light pools ON THE GROUND, behind props and people, at precinct doors.
  // Training, warehouse combat and Zombie Outbreak are explicitly excluded.
  if (typeof drawCityGround === 'function') {
    var oldGround = drawCityGround;
    var halo = null;
    function haloTexture() {
      if (halo) return halo;
      halo = document.createElement('canvas');
      halo.width = 160; halo.height = 72;
      var g = halo.getContext('2d');
      g.save();g.translate(80,36);g.scale(1,.45);
      var glow = g.createRadialGradient(0,0,0,0,0,78);
      glow.addColorStop(0,'rgba(254,226,150,.20)');
      glow.addColorStop(.5,'rgba(254,226,150,.09)');
      glow.addColorStop(1,'rgba(254,226,150,0)');
      g.fillStyle=glow;g.beginPath();g.arc(0,0,78,0,Math.PI*2);g.fill();
      g.restore();return halo;
    }
    drawCityGround = function (t) {
      var result = oldGround.apply(this, arguments);
      if (!campaign() || state.map !== 'plaza') return result;
      var h = haloTexture();
      ctx.save();
      ctx.globalCompositeOperation = 'screen';
      ctx.drawImage(h, 800-80, 553-36);
      ctx.drawImage(h, 1276-80, 291-36);
      ctx.restore();
      counters.pools += 2;
      return result;
    };
  }
  H.visualPolishV113 = {
    version: '113-main-visual-pass-1',
    enabled: function () { return enabled; },
    setEnabled: function (value) { enabled = !!value; return enabled; },
    active: campaign,
    stats: function () { return { version: this.version, enabled: enabled,
      actors: counters.actors, pedestrians: counters.pedestrians,
      roomTints: counters.roomTints, pools: counters.pools }; }
  };
})();
