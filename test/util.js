'use strict';

var assert = require('assert'),
    util = require('../lib/util');

describe('util', function() {

    describe('#currentCongress', function() {
        it('should return congress for current year', function() {
            var congress = util.congressFromYear(util.currentLegislativeYear());
            assert(util.currentCongress() === congress);
        });
    });

    describe('#currentLegislativeYear', function() {
        it('should default to current year', function() {
            var date = new Date();
            assert(util.currentLegislativeYear() === util.currentLegislativeYear(date));
        });

        it('should return correct legislative year', function() {
            assert(util.currentLegislativeYear(new Date('01/01/2015')) === 2014);
            assert(util.currentLegislativeYear(new Date('01/03/2015')) === 2014);
            assert(util.currentLegislativeYear(new Date('01/03/2015 13:00')) === 2015);
            assert(util.currentLegislativeYear(new Date('01/04/2015')) === 2015);
        });
    });

    describe('#congressFromYear', function() {
        it('should return correct congress for any year 1789 or greater', function() {
            assert(util.congressFromYear(1789) === 1);
            assert(util.congressFromYear(2015) === 114);
        });

        it('should return value less than one for any year prior to 1789', function() {
            assert(util.congressFromYear(1788) < 1);
        });
    });

    describe('#congressSuffix', function() {
        it('should return appropriate suffix', function() {
            assert(util.congressSuffix(0) === '');
            assert(util.congressSuffix(1) === 'st');
            assert(util.congressSuffix(2) === 'nd');
            assert(util.congressSuffix(3) === 'rd');
            assert(util.congressSuffix(11) === 'th');
            assert(util.congressSuffix(12) === 'th');
            assert(util.congressSuffix(13) === 'th');
        });

        it('should return "th" in all other cases', function() {
            assert(util.congressSuffix(4) === 'th');
        });

        it('should work with both numbers and strings', function() {
            assert(util.congressSuffix('4') === 'th');
        });
    });

    describe('#billType', function() {
        it('should return undefined for invalid bill type', function() {
            assert(typeof util.billType('') === 'undefined');
        });

        it('should return standard type for all acceptable bill types', function() {
            assert(util.billType('hr') === 'house-bill');
            assert(util.billType('hres') === 'house-resolution');
            assert(util.billType('hjres') === 'house-joint-resolution');
            assert(util.billType('hconres') === 'house-concurrent-resolution');
            assert(util.billType('s') === 'senate-bill');
            assert(util.billType('sres') === 'senate-resolution');
            assert(util.billType('sjres') === 'senate-joint-resolution');
            assert(util.billType('sconres') === 'senate-concurrent-resolution');
        });
    });

});