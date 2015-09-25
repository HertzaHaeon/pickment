module.exports = function(grunt) {

  // Project configuration.
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    uglify: {
      options: {
        banner: '// <%= pkg.name %> v<%= pkg.version %>, Mikael Tilly, MIT License\n'
      },
      dynamic_mappings: {
        files: [
          {
            expand: true,
            cwd: 'src/',
            src: ['*.js'],
            dest: 'dist/',
            ext: '.min.js',
            extDot: 'first'
          },
          {
            'dist/ng-pickment-all.min.js' : ['src/ng-pickment.js', 'ng-pickment-*.js']
          }
        ]
      }
    }
  });

  // Load the plugin that provides the "uglify" task.
  grunt.loadNpmTasks('grunt-contrib-uglify');

  // Default task(s).
  grunt.registerTask('default', ['uglify']);

};
