class RedmineCkeditor5Setting
  def self.setting
    Setting[:plugin_redmine_ckeditor5] || {}
  end

  def self.toolbar_string
    setting["toolbar"] || RedmineCkeditor5.default_toolbar
  end

  def self.toolbar
    toolbar_string.split(/\s+/)
  end

  def self.height
    (setting["height"] || 400).to_i
  end
end
