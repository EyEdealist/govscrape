'use strict';

var assert = require('assert'),
    fs = require('fs'),
    sinon = require('sinon'),
    request = require('../lib/request'),
    util = require('../lib/util'),
    billList = require('../lib/bill-list');

describe('bill-list', function() {
    var fixture;

    before('load fixture', function(done) {
        fs.readFile('test/fixtures/bill-list.html', 'utf-8', function(err, data) {
            if(err) {
                throw err;
            }

            fixture = data;
            done();
        });
    });

    describe('#parse', function() {

        it('should throw an error when no argument', function() {
            assert.throws(function() {
                billList.parse();
            });
        });

        it('should return an object with no bills when invalid html string', function() {
            var result = billList.parse('');
            assert(typeof result === 'object');
            assert(result.start === 0);
            assert(result.end === 0);
            assert(result.of === 0);
            assert(Array.isArray(result.bills));
            assert(result.bills.length === 0);
        });

        it('should parse fixture and return 250 of 8913 bills', function() {
            var result = billList.parse(fixture);
            assert(result.start === 1);
            assert(result.end === 250);
            assert(result.of === 8913);
            assert(result.bills.length === 250);
        });

        it('should parse fixture and provide summary of each bill', function() {
            var result = billList.parse(fixture);

            result.bills.forEach(function(bill) {
                assert(bill.id != null && bill.id !== '');
                assert(bill.type != null && bill.type !== '');
                assert(bill.number != null && typeof bill.number === 'number');
                assert(bill.congress != null && typeof bill.congress === 'number');
                assert(bill.title != null && bill.title !== '');
                assert(bill.introduced_at === null || bill.introduced_at !== '');
                assert(bill.last_action === null || bill.last_action !== '');
                assert(bill.href != null && bill.href !== '');
            });
        });
    });

    describe('#fetch', function() {
        beforeEach('mock request', function(done) {
            // Stub request.get so no request is actually made
            sinon.stub(request, 'get')
                .yields(null, null, fixture);
            done();
        });

        afterEach('restore request', function(done) {
            request.get.restore();
            done();
        });

        it('should throw an error when no arguments', function() {
            assert.throws(function() {
                billList.fetch();
            });
        });

        it('should make a single http request', function(done) {
            var spy = sinon.spy();

            billList.fetch(spy);

            assert(spy.calledWith(null, fixture));
            assert(request.get.calledOnce);
            done();
        });

        it('should default to 250 bills per page for current congress', function (done) {
            var spy = sinon.spy();

            billList.fetch(spy);

            assert(request.get.calledWith({
                url: 'https://congress.gov/legislation',
                qs: {
                    pageSize: 250,
                    page: 1,
                    q: JSON.stringify({
                        type: 'bills',
                        congress: util.currentCongress()
                    })
                }
            }));
            done();
        });

        it('should use page, pageSize, chamber, and congress as query options', function(done) {
            var spy = sinon.spy();
            var query = {
                pageSize: 100,
                page: 2,
                congress: 113,
                chamber: 'senate'
            };

            billList.fetch(query, spy);

            assert(request.get.calledWith({
                url: 'https://congress.gov/legislation',
                qs: {
                    pageSize: 100,
                    page: 2,
                    q: JSON.stringify({
                        type: 'bills',
                        congress: 113,
                        chamber: 'senate'
                    })
                }
            }));
            done();
        });
    });

    describe('#scrape', function() {
        beforeEach('mock request', function(done) {
            // Stub request.get so no request is actually made
            sinon.stub(request, 'get')
                .yields(null, null, fixture);
            done();
        });

        afterEach('restore request', function(done) {
            request.get.restore();
            done();
        });

        it('should throw an error when no arguments', function() {
            assert.throws(function() {
                billList.scrape();
            });
        });

        it('should call fetch, then parse', function() {
            var spy = sinon.spy();
            var fetchSpy = sinon.spy(billList, 'fetch');
            var parseSpy = sinon.spy(billList, 'parse');

            billList.scrape(spy);
            assert(fetchSpy.calledOnce);
            assert(parseSpy.calledOnce);

            fetchSpy.restore();
            parseSpy.restore();
        });

        it('should scrape until all bills parsed', function(done) {
            this.timeout(0);

            // Fixture has 250 bills, and all will be processed
            // even though the last page may be sparse
            billList.scrape(function(err, bills) {
                assert(bills.length === (Math.ceil(8913/250) * 250));
                done();
            });
        });
    });

});