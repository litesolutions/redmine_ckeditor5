module RedmineCkeditor5::WikiFormatting
  module Helper
    include RedmineCkeditor5::Helper

    def replace_editor_script(field_id, preview_url)
      locale = current_language.to_s.downcase.sub("_", "-")
      options = RedmineCkeditor5.options(@project).merge(
        :language => locale,
        :translationFile => RedmineCkeditor5.ck5_translation_file(locale)
      )

      <<-EOT
        (function() {
          var textarea = document.getElementById('#{field_id}');
          if (!textarea) return;
          new jsToolBar(textarea).setPreviewUrl('#{preview_url}');
          RedmineCkeditor5.whenReady(function(RC5) {
            RC5.init('#{field_id}', #{options.to_json});
          });
        })();
      EOT
    end

    def overwrite_functions
      <<-EOT
        if (!jsToolBar.prototype._showPreview) {
          jsToolBar.prototype._showPreview = jsToolBar.prototype.showPreview
          jsToolBar.prototype.showPreview = function(event) {
            this._showPreview(event);
            $(this.textarea).next().hide();
          }
        }

        if (!jsToolBar.prototype._hidePreview) {
          jsToolBar.prototype._hidePreview = jsToolBar.prototype.hidePreview
          jsToolBar.prototype.hidePreview = function(event) {
            this._hidePreview(event);
            $(this.textarea).next().show();
          }
        }
      EOT
    end

    def wikitoolbar_for(field_id, preview_url = preview_text_path)
      heads_for_wiki_formatter
      script = replace_editor_script(field_id, preview_url)
      script += overwrite_functions if request.format.html?
      javascript_tag(script)
    end

    def initial_page_content(page)
      "<h1>#{ERB::Util.html_escape page.pretty_title}</h1>"
    end

    def heads_for_wiki_formatter
      unless @heads_for_wiki_formatter_included
        content_for :header_tags do
          javascript_include_tag('jstoolbar/jstoolbar') +
          javascript_include_tag("jstoolbar/lang/jstoolbar-#{current_language.to_s.downcase}") +
          stylesheet_link_tag('jstoolbar') +
          ckeditor5_javascripts
        end
        @heads_for_wiki_formatter_included = true
      end
    end
  end
end
