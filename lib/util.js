'use strict';

var billTypes = {
    hr: 'house-bill',
    hres: 'house-resolution',
    hjres: 'house-joint-resolution',
    hconres: 'house-concurrent-resolution',
    s: 'senate-bill',
    sres: 'senate-resolution',
    sjres: 'senate-joint-resolution',
    sconres: 'senate-concurrent-resolution'
};

/**
 * Gets current congress number
 *
 * @return {number}
 */
exports.currentCongress = function() {
    var year = exports.currentLegislativeYear();
    return exports.congressFromYear(year);
};

/**
 * Gets current legislative year from a date
 *
 * @param {Date} [date]
 * @returns {number}
 */
exports.currentLegislativeYear = function(date) {
    if(!date || !date instanceof Date) {
        date = new Date();
    }

    var year = date.getFullYear(),
        month = date.getMonth() + 1,
        day = date.getDate(),
        hours = date.getHours();

    if(month === 1) {
        if(day === 1 || day === 2) {
            return year - 1;
        }
        if(day === 3 && hours < 12) {
            return year - 1;
        }

        return year;
    } else {
        return year;
    }
};

/**
 * Gets congress number from year
 *
 * @param {number|string} year
 * @returns {number}
 */
exports.congressFromYear = function(year) {
    year = parseInt(year);
    return ((year + 1) / 2) - 894;
};

/**
 * Gets correct suffix for provided congress number
 *
 * @param {number|string} congress
 * @returns {string}
 */
exports.congressSuffix = function(congress) {
    congress = '' + congress;

    switch(congress.substr(-2)) {
        case '11':
        case '12':
        case '13':
            return 'th';
        default:
            switch(congress.substr(-1)) {
                case '2':
                    return 'nd';
                case '3':
                    return 'rd';
                case '1':
                    return 'st';
                case '0':
                     return '';
                default:
                    return 'th';
            }
    }
};

/**
 * Resolves bill type to standardized format
 *
 * @param {string} type
 * @returns {string}
 */
exports.billType = function(type) {
    return billTypes[type.toLowerCase()];
};
