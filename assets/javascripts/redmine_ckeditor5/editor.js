import {
  ClassicEditor,
  Plugin,
  ButtonView,
  Essentials,
  Paragraph,
  Heading,
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Subscript,
  Superscript,
  RemoveFormat,
  Font,
  Alignment,
  List,
  Indent,
  IndentBlock,
  BlockQuote,
  Table,
  TableToolbar,
  TableProperties,
  TableCellProperties,
  HorizontalLine,
  Link,
  Image,
  ImageUpload,
  ImageToolbar,
  ImageCaption,
  ImageStyle,
  ImageResize,
  LinkImage,
  FindAndReplace,
  ShowBlocks,
  SourceEditing,
  GeneralHtmlSupport,
  CodeBlock,
  PasteFromOffice,
  Autoformat
} from './vendor/ckeditor5.js';

var BROWSE_ICON = '<svg viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">' +
  '<path d="M2 4a1 1 0 0 1 1-1h4.4l1.2 1.6H17a1 1 0 0 1 1 1V15a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V4z" ' +
  'fill="none" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"/>' +
  '<circle cx="7.5" cy="10.5" r="1.4" fill="none" stroke="currentColor" stroke-width="1.2"/>' +
  '<path d="M5 14l2.8-3 2 1.8L13 9l3 5H5z" fill="currentColor"/>' +
  '</svg>';

class RichImagePlugin extends Plugin {
  static get pluginName() {
    return 'RichImage';
  }

  init() {
    var editor = this.editor;

    editor.ui.componentFactory.add('richImage', function (locale) {
      var view = new ButtonView(locale);
      var label = editor.config.get('richImage.label') || 'Image';

      view.set({
        label: label,
        icon: BROWSE_ICON,
        tooltip: true
      });

      view.on('execute', function () {
        var options = editor.config.get('richImage.options') || {};
        window.RedmineCkeditor5.openRichImageDialog(editor, options);
      });

      return view;
    });
  }
}

var PLUGINS = [
  Essentials, Paragraph, Heading,
  Bold, Italic, Underline, Strikethrough, Subscript, Superscript, RemoveFormat,
  Font, Alignment,
  List, Indent, IndentBlock, BlockQuote, CodeBlock,
  Table, TableToolbar, TableProperties, TableCellProperties, HorizontalLine,
  Link,
  Image, ImageUpload, ImageToolbar, ImageCaption, ImageStyle, ImageResize, LinkImage,
  FindAndReplace, ShowBlocks, SourceEditing, GeneralHtmlSupport,
  PasteFromOffice, Autoformat,
  RichImagePlugin
];

var HTML_SUPPORT = {
  allow: [
    { name: /^(div|span|figure|figcaption)$/, styles: true, classes: true, attributes: true }
  ]
};

// CKEditor 5's CodeBlock plugin defaults to "language-xxx" classes on <code>,
// but Redmine's own formatter (and the legacy CKEditor 4 plugin) stores and
// reads back a bare class equal to the Rouge lexer name, e.g.
// <pre><code class="ruby">. Without this, CKEditor 5 doesn't recognize
// existing <pre><code class="ruby"> content as a code block at all, and
// flattens it on load. Map the languages most likely to show up in existing
// content to that same bare class name, so both old and new content survive
// a round trip. Add more entries here if a language used in your wiki/issues
// content is missing.
var CODE_BLOCK_LANGUAGES = [
  { language: 'plaintext', label: 'Plain text', class: '' },
  { language: 'ruby', label: 'Ruby', class: 'ruby' },
  { language: 'python', label: 'Python', class: 'python' },
  { language: 'javascript', label: 'JavaScript', class: 'javascript' },
  { language: 'typescript', label: 'TypeScript', class: 'typescript' },
  { language: 'json', label: 'JSON', class: 'json' },
  { language: 'yaml', label: 'YAML', class: 'yaml' },
  { language: 'xml', label: 'XML', class: 'xml' },
  { language: 'html', label: 'HTML', class: 'html' },
  { language: 'css', label: 'CSS', class: 'css' },
  { language: 'sql', label: 'SQL', class: 'sql' },
  { language: 'bash', label: 'Shell', class: 'bash' },
  { language: 'shell', label: 'Shell (shell)', class: 'shell' },
  { language: 'diff', label: 'Diff', class: 'diff' },
  { language: 'java', label: 'Java', class: 'java' },
  { language: 'c', label: 'C', class: 'c' },
  { language: 'cpp', label: 'C++', class: 'cpp' },
  { language: 'csharp', label: 'C#', class: 'csharp' },
  { language: 'go', label: 'Go', class: 'go' },
  { language: 'php', label: 'PHP', class: 'php' },
  { language: 'perl', label: 'Perl', class: 'perl' },
  { language: 'ini', label: 'INI', class: 'ini' },
  { language: 'dockerfile', label: 'Dockerfile', class: 'dockerfile' },
  { language: 'markdown', label: 'Markdown', class: 'markdown' }
];

var RC5 = window.RedmineCkeditor5;
RC5.instances = {};

function csrfToken() {
  var meta = document.querySelector('meta[name="csrf-token"]');
  return meta ? meta.content : null;
}

function parseUris(html) {
  var doc = new DOMParser().parseFromString(html, 'text/html');
  var img = doc.querySelector('[data-uris]');
  if (!img) return null;
  try {
    return {
      uris: JSON.parse(img.getAttribute('data-uris')),
      type: img.getAttribute('data-rich-asset-type'),
      name: img.getAttribute('data-rich-asset-name'),
      id: img.getAttribute('data-rich-asset-id')
    };
  } catch (e) {
    return null;
  }
}

function fetchRichFile(uploadUrl, id) {
  return fetch(uploadUrl + '/' + id, {
    credentials: 'same-origin',
    headers: { 'X-Requested-With': 'XMLHttpRequest' }
  }).then(function (resp) { return resp.text(); }).then(parseUris);
}

// -- Shared upload (used by paste/drag&drop and by the dialog's own input) -

function uploadFile(file, options) {
  var formData = new FormData();
  formData.append('file', file);
  formData.append('simplified_type', file.type.indexOf('image/') === 0 ? 'image' : 'file');
  if (options.scopeType) {
    formData.append('scoped', 'true');
    formData.append('scope_type', options.scopeType);
    formData.append('scope_id', options.scopeId);
  }

  return fetch(options.uploadUrl, {
    method: 'POST',
    body: formData,
    credentials: 'same-origin',
    headers: { 'X-CSRF-Token': csrfToken() }
  })
    .then(function (resp) { return resp.json(); })
    .then(function (data) {
      if (!data.success) {
        return Promise.reject(data.error || 'Upload failed');
      }
      return fetchRichFile(options.uploadUrl, data.rich_id).then(function (info) {
        if (!info) return Promise.reject('Upload failed');
        return info;
      });
    });
}

function deleteFile(id, options) {
  return fetch(options.uploadUrl + '/' + id, {
    method: 'DELETE',
    credentials: 'same-origin',
    headers: {
      'X-CSRF-Token': csrfToken(),
      'X-Requested-With': 'XMLHttpRequest'
    }
  });
}

// -- Upload adapter (paste / drag&drop directly into the editor body) ------

function UploadAdapter(loader, options) {
  this.loader = loader;
  this.options = options;
}

UploadAdapter.prototype.upload = function () {
  var options = this.options;
  return this.loader.file.then(function (file) {
    return uploadFile(file, options).then(function (info) {
      return { default: info.uris.original };
    });
  });
};

UploadAdapter.prototype.abort = function () {};

function uploadAdapterPlugin(options) {
  return function (editor) {
    editor.plugins.get('FileRepository').createUploadAdapter = function (loader) {
      return new UploadAdapter(loader, options);
    };
  };
}

// -- Combined "insert image" dialog: upload, browse existing, delete ------

RC5.openRichImageDialog = function (editor, options) {
  if (!editor) return;

  var dialog = document.createElement('dialog');
  dialog.className = 'redmine-ckeditor5-file-browser';
  dialog.innerHTML =
    '<header>' +
      '<label class="button upload">' + (options.uploadLabel || 'Upload a new file') +
        '<input type="file" accept="image/*" hidden></label>' +
      '<form method="dialog"><button type="submit" class="close" title="' +
        (options.closeLabel || 'Close') + '">&times;</button></form>' +
    '</header>' +
    '<div class="body">' +
      '<p class="loading">' + (options.loadingLabel || 'Loading...') + '</p>' +
      '<ul class="files"></ul>' +
    '</div>';
  document.body.appendChild(dialog);

  dialog.addEventListener('close', function () {
    dialog.remove();
  });

  var list = dialog.querySelector('ul.files');

  function addItem(info) {
    dialog.querySelector('li.nodata') && dialog.querySelector('li.nodata').remove();

    var li = document.createElement('li');
    li.dataset.id = info.id;
    li.innerHTML =
      '<img src="' + (info.uris.rich_thumb || info.uris.original) + '" alt="">' +
      '<span>' + info.name + '</span>' +
      '<button type="button" class="delete" title="' + (options.deleteLabel || 'Delete') + '">&times;</button>';

    li.querySelector('img').addEventListener('click', function () {
      editor.execute('insertImage', { source: info.uris.original });
      dialog.close();
    });

    li.querySelector('.delete').addEventListener('click', function (event) {
      event.stopPropagation();
      if (!window.confirm(options.deleteConfirmLabel || 'Delete this file?')) return;
      deleteFile(info.id, options).then(function () { li.remove(); });
    });

    list.insertBefore(li, list.firstChild);
  }

  var fileInput = dialog.querySelector('input[type=file]');
  fileInput.addEventListener('change', function () {
    var file = fileInput.files[0];
    if (!file) return;
    uploadFile(file, options).then(function (info) {
      editor.execute('insertImage', { source: info.uris.original });
      dialog.close();
    }).catch(function (error) {
      window.alert(options.uploadErrorLabel || error);
    });
  });

  var params = new URLSearchParams({ type: 'image' });
  if (options.scopeType) {
    params.set('scope_type', options.scopeType);
    params.set('scope_id', options.scopeId);
  }

  fetch(options.browseUrl + '?' + params.toString(), {
    credentials: 'same-origin',
    headers: { 'X-Requested-With': 'XMLHttpRequest' }
  })
    .then(function (resp) { return resp.text(); })
    .then(function (html) {
      var doc = new DOMParser().parseFromString(html, 'text/html');
      var items = doc.querySelectorAll('[data-uris]');
      dialog.querySelector('.loading').remove();

      if (items.length === 0) {
        list.innerHTML = '<li class="nodata">' + (options.emptyLabel || 'No files yet') + '</li>';
      }

      items.forEach(function (img) {
        addItem({
          id: img.getAttribute('data-rich-asset-id'),
          name: img.getAttribute('data-rich-asset-name'),
          uris: JSON.parse(img.getAttribute('data-uris'))
        });
      });
    });

  dialog.showModal();
};

// -- Lifecycle --------------------------------------------------------------

function loadTranslations(translationFile) {
  if (!translationFile) return Promise.resolve([]);
  return import('./vendor/translations/' + translationFile + '.js')
    .then(function (mod) { return [mod.default]; })
    .catch(function () { return []; });
}

// CKEditor 5's CodeBlock feature only recognizes <pre><code>...</code></pre>;
// a bare <pre> with no <code> child (which is what plain preformatted blocks
// look like, e.g. content typed without picking a language) is invisible to
// it and gets flattened on load. Wrap those so CodeBlock claims them too.
function ensureCodeBlocksHaveCode(html) {
  return html.replace(/<pre\b[^>]*>(?!\s*<code\b)([\s\S]*?)<\/pre>/gi, function (match, inner) {
    // Per the HTML spec, browsers drop a single leading newline right after
    // <pre>; CKEditor 5 doesn't, so without this it shows as a blank line.
    inner = inner.replace(/^\r?\n/, '');
    return '<pre><code class="plaintext">' + inner + '</code></pre>';
  });
}

RC5.init = function (textareaId, options) {
  var textarea = document.getElementById(textareaId);
  if (!textarea) return;

  textarea.value = ensureCodeBlocksHaveCode(textarea.value);

  return loadTranslations(options.translationFile).then(function (translations) {
    return ClassicEditor.create(textarea, {
      licenseKey: 'GPL',
      plugins: PLUGINS,
      toolbar: options.toolbar,
      language: options.language || 'en',
      translations: translations,
      htmlSupport: HTML_SUPPORT,
      extraPlugins: [uploadAdapterPlugin(options)],
      richImage: {
        options: options,
        label: options.richImageLabel
      },
      image: {
        toolbar: ['imageStyle:inline', 'imageStyle:block', 'imageStyle:side', '|', 'toggleImageCaption', 'linkImage']
      },
      table: {
        contentToolbar: ['tableColumn', 'tableRow', 'mergeTableCells', 'tableProperties', 'tableCellProperties']
      },
      codeBlock: {
        languages: CODE_BLOCK_LANGUAGES
      }
    }).then(function (editor) {
      RC5.instances[textareaId] = editor;

      editor.editing.view.change(function (writer) {
        var root = editor.editing.view.document.getRoot();
        // Matches CKEditor 4's bodyClass: "wiki", so the editor uses the same
        // typography Redmine applies when it renders the saved HTML (see
        // .wiki h1/h2/... in application.css). CKEditor 5 has no iframe to
        // isolate styles, so this has to be done explicitly.
        writer.addClass('wiki', root);
        if (options.height) {
          writer.setStyle('min-height', options.height + 'px', root);
        }
      });

      var form = textarea.closest('form');
      if (form) {
        form.addEventListener('submit', function () {
          editor.updateSourceElement();
        });
      }

      // Redmine refreshes the new-issue form via AJAX (e.g. on tracker,
      // status or category change) by serializing the form directly,
      // without firing its 'submit' event. Keep the textarea live-synced
      // so that path picks up the current content too, not just real submits.
      editor.model.document.on('change:data', function () {
        editor.updateSourceElement();
      });

      return editor;
    });
  });
};

RC5.setData = function (textareaId, html) {
  var editor = RC5.instances[textareaId];
  if (editor) editor.setData(ensureCodeBlocksHaveCode(html));
};

RC5.showAndScrollTo = function (id, focusId) {
  var elem = document.getElementById(id);
  if (elem) elem.style.display = '';
  if (focusId && RC5.instances[focusId]) RC5.instances[focusId].editing.view.focus();
  if (elem) elem.scrollIntoView({ behavior: 'smooth' });
};

window.showAndScrollTo = window.showAndScrollTo || RC5.showAndScrollTo;

RC5.destroyEditor = function (textareaId) {
  var editor = RC5.instances[textareaId];
  if (editor) {
    editor.destroy();
    delete RC5.instances[textareaId];
  }
};

window.destroyEditor = window.destroyEditor || RC5.destroyEditor;

RC5._flush();
