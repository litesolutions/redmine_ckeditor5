module RedmineCkeditor5
  extend ActionView::Helpers

  class << self
    def root
      @root ||= Pathname(File.expand_path(File.dirname(File.dirname(__FILE__))))
    end

    def allowed_protocols
      @allowed_protocols ||= %w[
        afs aim callto ed2k feed ftp gopher http https irc mailto news
        nntp rsync rtsp sftp ssh tag telnet urn webcal xmpp
      ]
    end

    def allowed_tags
      @allowed_tags ||= %w[
        a abbr acronym address blockquote b big br caption cite code dd del dfn
        div dt em h1 h2 h3 h4 h5 h6 hr i img ins kbd li ol p pre samp small span
        strike s strong sub sup table tbody td tfoot th thead tr tt u ul var
        figure figcaption
      ]
    end

    def allowed_attributes
      @allowed_attributes ||= %w[
        href src width height alt cite datetime title class name xml:lang abbr dir
        style align valign border cellpadding cellspacing colspan rowspan nowrap
        start reversed data-rich-asset-id
      ]
    end

    def default_toolbar
      @default_toolbar ||= %w[
        undo redo | findAndReplace | heading
        | bold italic underline strikethrough subscript superscript removeFormat
        | fontFamily fontSize fontColor fontBackgroundColor | alignment
        | bulletedList numberedList | outdent indent | blockQuote codeBlock insertTable horizontalLine
        | link richImage
        | showBlocks sourceEditing
      ].join(" ")
    end

    def enabled?
      Setting.text_formatting == "CKEditor"
    end

    # Redmine locale => CKEditor 5 translation file basename (vendored under
    # assets/javascripts/redmine_ckeditor5/vendor/translations). Locales not
    # listed here, or not shipped by CKEditor 5, fall back to English.
    LOCALE_MAP = {
      "ar" => "ar", "az" => "az", "bg" => "bg", "bs" => "bs", "ca" => "ca",
      "cs" => "cs", "da" => "da", "de" => "de", "el" => "el", "en-gb" => "en-gb",
      "es-pa" => "es", "es" => "es", "et" => "et", "eu" => "eu", "fa" => "fa",
      "fi" => "fi", "fr" => "fr", "gl" => "gl", "he" => "he", "hr" => "hr",
      "hu" => "hu", "id" => "id", "it" => "it", "ja" => "ja", "ko" => "ko",
      "lt" => "lt", "lv" => "lv", "nl" => "nl", "no" => "no", "pl" => "pl",
      "pt-br" => "pt-br", "pt" => "pt", "ro" => "ro", "ru" => "ru", "sk" => "sk",
      "sl" => "sl", "sq" => "sq", "sr-yu" => "sr", "sr" => "sr", "sv" => "sv",
      "th" => "th", "tr" => "tr", "uk" => "uk", "vi" => "vi", "zh-tw" => "zh",
      "zh" => "zh-cn"
    }.freeze

    def ck5_translation_file(locale)
      LOCALE_MAP[locale.to_s.downcase]
    end

    def options(scope_object = nil)
      scope_type = scope_object && scope_object.class.model_name.name
      scope_id = scope_object && scope_object.id

      {
        :scopeType => scope_type,
        :scopeId => scope_id,
        :toolbar => RedmineCkeditor5Setting.toolbar,
        :height => RedmineCkeditor5Setting.height,
        :uploadUrl => "#{Redmine::Utils.relative_url_root}/rich/files",
        :browseUrl => "#{Redmine::Utils.relative_url_root}/rich/files",
        :richImageLabel => ::I18n.t(:label_ckeditor5_image_button),
        :uploadLabel => ::I18n.t(:label_ckeditor5_upload),
        :loadingLabel => ::I18n.t(:label_ckeditor5_loading),
        :emptyLabel => ::I18n.t(:label_ckeditor5_no_files),
        :deleteLabel => ::I18n.t(:label_ckeditor5_delete),
        :deleteConfirmLabel => ::I18n.t(:text_ckeditor5_delete_confirm),
        :uploadErrorLabel => ::I18n.t(:label_ckeditor5_upload_error),
        :closeLabel => ::I18n.t(:label_ckeditor5_close),
      }
    end

    def apply_patch
      ::ApplicationController.send :helper, ApplicationHelperPatch
      ::JournalsController.prepend JournalsControllerPatch
      ::MailHandler.prepend MailHandlerPatch
      ::MessagesController.prepend MessagesControllerPatch
      ::QueriesController.send :helper, QueriesHelperPatch
      ::Rich::FilesController.send :helper, RichFilesHelperPatch
    end

    # Redmine 6 (Propshaft) dropped the automatic plugin asset mirroring that
    # used to copy plugins/<name>/assets/* into public/plugin_assets/<name>/
    # on boot (Redmine::PluginLoader#mirror_assets no longer exists). CKEditor
    # itself needs those files reachable at a stable, literal URL (it fetches
    # its own skins/translations directly, not through the Rails asset
    # pipeline), so the plugin mirrors its own assets here instead of relying
    # on the host's Dockerfile to do it.
    def mirror_assets!
      source = root.join("assets")
      return unless source.directory?

      target = Rails.public_path.join("plugin_assets", "redmine_ckeditor5")
      FileUtils.rm_rf(target)
      FileUtils.mkdir_p(target)
      FileUtils.cp_r(Dir.glob(source.join("*")), target)
    rescue => e
      Rails.logger.error("[redmine_ckeditor5] failed to mirror assets: #{e.message}")
    end
  end
end

plugin_root = File.dirname(__FILE__)

require plugin_root + '/redmine_ckeditor5/uri_escape_compat'
require plugin_root + '/redmine_ckeditor5/helper'
require plugin_root + '/redmine_ckeditor5/wiki_formatting/formatter'
require plugin_root + '/redmine_ckeditor5/wiki_formatting/helper'
require plugin_root + '/redmine_ckeditor5/application_helper_patch'
require plugin_root + '/redmine_ckeditor5/queries_helper_patch'
require plugin_root + '/redmine_ckeditor5/rich_files_helper_patch'
require plugin_root + '/redmine_ckeditor5/journals_controller_patch'
require plugin_root + '/redmine_ckeditor5/messages_controller_patch'
require plugin_root + '/redmine_ckeditor5/mail_handler_patch'
require plugin_root + '/redmine_ckeditor5/pdf_patch'
require plugin_root + '/redmine_ckeditor5/tempfile_patch'

Rails.application.config.after_initialize do
  RedmineCkeditor5.apply_patch
end
