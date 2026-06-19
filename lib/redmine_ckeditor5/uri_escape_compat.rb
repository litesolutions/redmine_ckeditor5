module RedmineCkeditor5
  module UriEscapeCompat
    unless URI.respond_to?(:escape)
      module ::URI
        def self.escape(*args)
          DEFAULT_PARSER.escape(*args)
        end

        def self.unescape(*args)
          DEFAULT_PARSER.unescape(*args)
        end
      end
    end
  end
end
