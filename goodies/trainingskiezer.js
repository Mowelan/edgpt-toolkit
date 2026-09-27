/* Teamtool 'trainingskiezer' (vernieuwd 27-09-2026): bediening in goodies/_teamtool.js, logica ongewijzigd uit legacy/. */
window.EDGPT_TOOLKIT_MODULES['trainingskiezer'] = function (root, goodie, api) {
  return api.js(api.base + 'goodies/_teamtool.js').then(function () {
    return window.EDGPT_TEAMTOOL.run('wizard', root, goodie, api, {data:'trainingskiezer',tool:'trainingskiezer'});
  });
};
