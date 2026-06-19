module RedmineCkeditor5
  module RichFilesHelperPatch
    def thumb_for_file(file)
      Redmine::Utils.relative_url_root + if file.simplified_type == "image"
        file.rich_file.url(:rich_thumb)
      else
        "/plugin_assets/redmine_ckeditor5/images/document-thumb.png"
      end
    end
  end
end
