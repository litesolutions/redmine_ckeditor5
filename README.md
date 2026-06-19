# Redmine CKEditor 5 plugin

This plugin adds text formatting for using CKEditor 5 to Redmine, replacing the
legacy [redmine_ckeditor](https://github.com/nomadli/redmine_ckeditor) plugin
(CKEditor 4), which is not compatible with Redmine 6's asset pipeline
(Propshaft).

It includes [rich](https://github.com/nomadli/rich) and supports image
uploads, browsing previously uploaded images, and deleting them, all from a
single toolbar button.

## What is CKEditor 5?

CKEditor 5 is a WYSIWYG text editor. See
[the official site](https://ckeditor.com/ckeditor-5/) for more details. This
plugin vendors the open source (GPL 2+) self-hosted distribution of
CKEditor 5, so no external CDN is required at runtime.

## Requirements

* Redmine 6.x (built and tested against 6.1.2). It relies on Redmine's
  Propshaft asset pipeline and may not work on older Redmine versions.
* Ruby on Rails 7.2 (the version Redmine 6 ships with) — the plugin uses
  [kt-paperclip](https://github.com/kreeti/kt-paperclip) instead of the
  original `paperclip` gem because `paperclip` is unmaintained and
  incompatible with Rails 7.
* [ImageMagick](https://www.imagemagick.org/), for image thumbnails:
    ```
    # Debian/Ubuntu
    apt-get install imagemagick
    ```

## Plugin installation and setup

1. Clone this repository into the plugins directory, as `redmine_ckeditor5`:
    ```
    cd plugins
    git clone https://github.com/litesolutions/redmine_ckeditor5.git redmine_ckeditor5
    ```
2. Install the required gems (in the Redmine root directory):
    ```
    bundle install --without development test
    ```
3. Restart Redmine.
4. Change the text formatting (Administration > Settings > General > Text
   formatting) to CKEditor.
5. Configure the plugin (Administration > Plugins > Configure), to change the
   toolbar items or the editing area height.

The plugin mirrors its own static assets (the vendored CKEditor 5 build and
translations) into `public/plugin_assets/redmine_ckeditor5` on every boot —
no separate asset precompilation or `rake` task is required.

### Upgrade

1. Replace the plugin directory (`plugins/redmine_ckeditor5`).
2. Install the required gems:
    ```
    bundle install --without development test
    ```
3. Restart Redmine.

### Uninstall

1. Change the text formatting (Administration > Settings > General > Text
   formatting) to your formatter of choice (e.g. Markdown).
2. Delete the plugin directory (`plugins/redmine_ckeditor5`).
3. Remove `public/plugin_assets/redmine_ckeditor5` if you want to clean up
   the mirrored assets.

## CKEditor customization

### Toolbar

The toolbar items shown can be changed from the plugin's settings page
(Administration > Plugins > Configure), as a space-separated list of CKEditor 5
toolbar item names (use `|` as a separator between groups). See the
[CKEditor 5 toolbar documentation](https://ckeditor.com/docs/ckeditor5/latest/getting-started/setup/toolbar.html)
for the available item names.

### Languages

The editor UI automatically follows each user's Redmine language setting.
Translations for all the languages CKEditor 5 ships are vendored in
`assets/javascripts/redmine_ckeditor5/vendor/translations`; if a Redmine
locale has no matching CKEditor 5 translation, the UI falls back to English.
The mapping between Redmine locale codes and CKEditor 5 translation files
lives in `RedmineCkeditor5::LOCALE_MAP` (`lib/redmine_ckeditor5.rb`).

User-facing strings added by this plugin itself (the image dialog, buttons,
confirmations) are translated through Redmine's own locale files
(`config/locales/*.yml`). Currently English and Spanish are included;
contributions for other languages are welcome.

## Migration notes

This plugin stores contents in HTML format and renders it as is, exactly like
the legacy CKEditor 4 plugin did. If you are migrating from
`redmine_ckeditor` (CKEditor 4), no content migration is needed — existing
HTML content keeps working as is.

If you are switching from a plain-text formatter (Textile, Markdown) instead,
old content will be displayed as raw text. Consider the
[redmine_per_project_formatting](https://github.com/a-ono/redmine_per_project_formatting)
plugin for backward compatibility.

## Upgrading CKEditor 5 (for development)

This plugin vendors the official self-hosted build of the `ckeditor5` npm
package rather than depending on `node_modules` at runtime. To update it:

```
npm pack ckeditor5@<version>
tar xzf ckeditor5-<version>.tgz
cp package/dist/browser/ckeditor5.js  assets/javascripts/redmine_ckeditor5/vendor/ckeditor5.js
cp package/dist/browser/ckeditor5.css assets/stylesheets/redmine_ckeditor5/vendor-ckeditor5.css

# skip the *.umd.js and *.d.ts variants, we only use the plain ESM ones
for f in package/dist/translations/*.js; do
  case "$f" in *.umd.js) continue ;; esac
  cp "$f" assets/javascripts/redmine_ckeditor5/vendor/translations/
done
```

Then update the plugin list and toolbar configuration in
`assets/javascripts/redmine_ckeditor5/editor.js` and
`lib/redmine_ckeditor5.rb` if the new version renames or removes any plugin
you rely on, and update the vendored version number wherever it's referenced.

## License

This plugin is distributed under the GPLv3 license (see `LICENSE`).
CKEditor 5 itself is used under its GPL 2+ open source license; the
`licenseKey: 'GPL'` setting in `editor.js` is what CKEditor 5 requires to run
under that license, and is what shows the "Powered by CKEditor" badge in the
editor.
