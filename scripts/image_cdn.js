'use strict';

function replaceImage(content, prefix_from, prefix_to) {
  return content.replace(/<img.*?src=["'](.*?)["'].*?>/gi, function (str, ...matched) {
    let m = matched[0];
    if (m.startsWith(prefix_from)) {
      return str.replace(prefix_from, prefix_to);
    } else {
      return str;
    }
  });
}

// when generate
hexo.extend.filter.register('after_post_render', function (data) {
  data.content = replaceImage(data.content, '/../../images/', 'https://bimg.gonwan.com/');
  return data;
});

// when preview
// hexo.extend.filter.register('after_render:html', function(content, data) {
//   content = replaceImage(content, '/../../images/', 'https://bimg.gonwan.com/');
//   return content;
// });
