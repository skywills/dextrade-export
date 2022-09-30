"use strict";

import { describe, it, beforeEach, afterEach } from "mocha";
import { expect } from "chai";
import Sinon from "sinon";
import { CLogger } from "mxw-libs-clogger";
import CommonUtils from "./common-utils";
import BigNumber from "bignumber.js";
let sandbox: Sinon.SinonSandbox;

describe("Suite: Endpoint - Order Utils", () => {
  beforeEach(async () => {
    sandbox = Sinon.createSandbox();
    // stub & silent Clogger
    sandbox.stub(CLogger.Instance);
  });

  afterEach(() => {
    if (sandbox) {
      sandbox.restore();
      sandbox = undefined;
    }
  });

  describe("Try Parse Amount", async () => {
    it("Try Parse Amount", async () => {
      let rawAmount = 1977538000000;
      let amount = CommonUtils.parseAmount(rawAmount);
      console.log(amount.toString());
      console.log(CommonUtils.toRawAmount(amount).toString());
      expect(rawAmount).equal(CommonUtils.toRawAmount(amount).toNumber())
    });
  });


});
