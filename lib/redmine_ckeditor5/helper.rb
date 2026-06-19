module RedmineCkeditor5
  module Helper
    # Plain literal URLs on purpose: these files are mirrored to
    # public/plugin_assets/redmine_ckeditor5 by RedmineCkeditor5.mirror_assets!
    # (see init.rb), not routed through the Rails asset pipeline. Using
    # javascript_include_tag/stylesheet_link_tag with :plugin => ... here
    # would instead generate a Propshaft /assets/plugin_assets/... URL that
    # does not correspond to any compiled asset and 404s.
    def ckeditor5_javascripts
      js_base = "#{Redmine::Utils.relative_url_root}/plugin_assets/redmine_ckeditor5/javascripts/redmine_ckeditor5"
      css_base = "#{Redmine::Utils.relative_url_root}/plugin_assets/redmine_ckeditor5/stylesheets/redmine_ckeditor5"

      content_tag(:script, "", :src => "#{js_base}/bootstrap.js") +
      content_tag(:script, "", :src => "#{js_base}/editor.js", :type => "module") +
      tag(:link, :rel => "stylesheet", :href => "#{css_base}/vendor-ckeditor5.css") +
      tag(:link, :rel => "stylesheet", :href => "#{css_base}/editor.css")
    end
  end
end
