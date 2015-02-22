'use strict';

module.exports = function(grunt) {
    
  // Project configuration.
  grunt.initConfig({
    nodeunit: {
      files: ['test/**/*_test.js'],
    },
    jshint: {
      options: {
        jshintrc: '.jshintrc'
      },
      gruntfile: {
        src: ['Gruntfile_*.js'],
      },
      src: {
        src: ['lib/**/*.js']
      },
      test: {
        src: ['test/**/*.js']
      },
    },
    exec: {
        browserify: './node_modules/browserify/bin/cmd.js -r ./lib/movico.js:movico -o ./build/movico-lang.js'
    }
  });

  // These plugins provide necessary tasks.
  grunt.loadNpmTasks('grunt-contrib-nodeunit');
  grunt.loadNpmTasks('grunt-contrib-jshint');  
  grunt.loadNpmTasks('grunt-exec');
    
  // Tasks
  grunt.registerTask('package', ['jshint', 'exec:browserify' ]);
  grunt.registerTask('default', ['jshint', 'nodeunit']);
};

