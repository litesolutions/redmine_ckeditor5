module RedmineCkeditor5
  module TempfilePatch
    def initialize(basename, *rest)
      super.tap do |f|
        f.binmode if basename == "raw-upload."
      end
    end
  end
end

Tempfile.prepend RedmineCkeditor5::TempfilePatch
