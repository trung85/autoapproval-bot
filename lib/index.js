"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
module.exports = function (app) {
    app.on(['pull_request.opened', 'pull_request.reopened', 'pull_request.labeled', 'pull_request.edited', 'pull_request_review'], function (context) { return __awaiter(void 0, void 0, void 0, function () {
        var config, pr, prLabels, blacklistedLabels, ownerSatisfied, requiredLabelsSatisfied, appliedRequiredLabels, missingRequiredLabels, reviews;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, context.config('autoapproval.yml')];
                case 1:
                    config = _a.sent();
                    context.log(config, '\n\nLoaded config');
                    context.log('Repo: %s', context.payload.repository.full_name);
                    pr = context.payload.pull_request;
                    context.log('PR: %s', pr.html_url);
                    prLabels = pr.labels.map(function (label) { return label.name; });
                    context.log('PR lables: %s', prLabels);
                    blacklistedLabels = [];
                    if (config.blacklisted_labels !== undefined) {
                        blacklistedLabels = config.blacklisted_labels
                            .filter(function (blacklistedLabel) { return prLabels.includes(blacklistedLabel); });
                        // if PR contains any black listed labels, do not proceed further
                        if (blacklistedLabels.length > 0) {
                            context.log('PR black listed from approving: %s', blacklistedLabels);
                            return [2 /*return*/];
                        }
                    }
                    if (context.payload.action === "submitted") {
                        context.log('do nothing in submitted action');
                        return [2 /*return*/];
                    }
                    ownerSatisfied = config.from_owner.length === 0 || config.from_owner.includes(pr.user.login);
                    if (config.required_labels_mode === 'one_of') {
                        appliedRequiredLabels = config.required_labels
                            .filter(function (requiredLabel) { return prLabels.includes(requiredLabel); });
                        requiredLabelsSatisfied = appliedRequiredLabels.length > 0;
                    }
                    else {
                        missingRequiredLabels = config.required_labels
                            .filter(function (requiredLabel) { return !prLabels.includes(requiredLabel); });
                        requiredLabelsSatisfied = missingRequiredLabels.length === 0;
                    }
                    if (!(requiredLabelsSatisfied && ownerSatisfied)) return [3 /*break*/, 3];
                    return [4 /*yield*/, getAutoapprovalReviews(context)];
                case 2:
                    reviews = _a.sent();
                    context.log(context.payload.action);
                    if (reviews.length > 0) {
                        context.log('PR has already reviews');
                        if (context.payload.action === 'dismissed') {
                            approvePullRequest(context);
                            applyLabels(context, config.apply_labels, config.required_labels);
                            applyAutoMerge(context, prLabels, config.auto_merge_labels, config.auto_rebase_merge_labels, config.auto_squash_merge_labels);
                            context.log('Review was dismissed, approve again');
                        }
                    }
                    else {
                        approvePullRequest(context);
                        applyLabels(context, config.apply_labels, config.required_labels);
                        applyAutoMerge(context, prLabels, config.auto_merge_labels, config.auto_rebase_merge_labels, config.auto_squash_merge_labels);
                        context.log('PR approved first time');
                    }
                    return [3 /*break*/, 4];
                case 3:
                    // one of the checks failed
                    context.log('Condition failed! \n - missing required labels: %s\n - PR owner found: %s', requiredLabelsSatisfied, ownerSatisfied);
                    _a.label = 4;
                case 4: return [2 /*return*/];
            }
        });
    }); });
};
function approvePullRequest(context) {
    return __awaiter(this, void 0, void 0, function () {
        var prParams;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    prParams = context.pullRequest({ event: 'APPROVE', body: 'Approved :+1:' });
                    return [4 /*yield*/, context.octokit.pulls.createReview(prParams)];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    });
}
function applyLabels(context, labels, required_labels) {
    return __awaiter(this, void 0, void 0, function () {
        var requiredLabelsParam, labelsParam;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!(labels.length > 0)) return [3 /*break*/, 3];
                    requiredLabelsParam = context.issue({ labels: required_labels });
                    return [4 /*yield*/, context.octokit.issues.removeAllLabels(requiredLabelsParam)
                        // trying to apply existing labels to PR. If labels didn't exist, this call will fail
                    ];
                case 1:
                    _a.sent();
                    labelsParam = context.issue({ labels: labels });
                    return [4 /*yield*/, context.octokit.issues.addLabels(labelsParam)];
                case 2:
                    _a.sent();
                    _a.label = 3;
                case 3: return [2 /*return*/];
            }
        });
    });
}
function applyAutoMerge(context, prLabels, mergeLabels, rebaseLabels, squashLabels) {
    if (mergeLabels && prLabels.filter(function (label) { return mergeLabels.includes(label); }).length > 0) {
        enableAutoMerge(context, 'MERGE');
    }
    if (rebaseLabels && prLabels.filter(function (label) { return rebaseLabels.includes(label); }).length > 0) {
        enableAutoMerge(context, 'REBASE');
    }
    if (squashLabels && prLabels.filter(function (label) { return squashLabels.includes(label); }).length > 0) {
        enableAutoMerge(context, 'SQUASH');
    }
}
var enableAutoMergeMutation = "\n  mutation($pullRequestId: ID!, $mergeMethod: PullRequestMergeMethod!) {\n    enablePullRequestAutoMerge(input:{\n      pullRequestId: $pullRequestId,\n      mergeMethod: $mergeMethod\n    }) {\n      pullRequest {\n        id,\n        autoMergeRequest {\n          mergeMethod\n        }\n      }\n    }\n  }\n";
function enableAutoMerge(context, method) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    context.log('Auto merging with merge method %s', method);
                    return [4 /*yield*/, context.octokit.graphql(enableAutoMergeMutation, {
                            pullRequestId: context.payload.pull_request.node_id,
                            mergeMethod: method
                        })];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    });
}
function getAutoapprovalReviews(context) {
    return __awaiter(this, void 0, void 0, function () {
        var pr, reviews, autoapprovalReviews;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    pr = context.pullRequest();
                    return [4 /*yield*/, context.octokit.pulls.listReviews(pr)];
                case 1:
                    reviews = _a.sent();
                    autoapprovalReviews = (reviews.data).filter(function (item) { return item.user.login === 'autoapproval[bot]'; });
                    return [2 /*return*/, autoapprovalReviews];
            }
        });
    });
}
//# sourceMappingURL=index.js.map