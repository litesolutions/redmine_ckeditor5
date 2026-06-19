require 'redmine'

plugin_root = File.dirname(__FILE__)

require plugin_root + '/lib/redmine_ckeditor5'

RedmineCkeditor5.mirror_assets!

Redmine::Plugin.register :redmine_ckeditor5 do
  name 'Redmine CKEditor 5 plugin'
  author 'Lite Solutions'
  description 'CKEditor 5 integration for Redmine, replacing the legacy CKEditor 4 plugin'
  version '1.0.0'
  requires_redmine :version_or_higher => '6.0.0'

  settings(:partial => 'settings/ckeditor5')

  wiki_format_provider 'CKEditor', RedmineCkeditor5::WikiFormatting::Formatter,
    RedmineCkeditor5::WikiFormatting::Helper
end

(Loofah::VERSION >= "2.3.0" ? Loofah::HTML5::SafeList : Loofah::HTML5::WhiteList)::ALLOWED_PROTOCOLS.replace RedmineCkeditor5.allowed_protocols
