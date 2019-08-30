import { Application } from 'probot' // eslint-disable-line no-unused-vars
import { PullRequestsCreateReviewParams, IssuesAddLabelsParams } from '@octokit/rest'

const getConfig = require('probot-config')

export = (app: Application) => {
  app.on(['pull_request.opened', 'pull_request.reopened', 'pull_request.labeled', 'pull_request.edited'], async (context) => {
    app.log(context)

    // reading configuration
    const config = await getConfig(context, 'autoapproval.yml')
    context.log(config, 'Loaded config')

    const pr = context.payload.pull_request

    // reading pull request labels for later check
    // if pull request contains all labels to be added,
    // then the assumption is that the PR is already approved and no actions required
    const prLabels: string[] = pr.labels.map((label: any) => label.name)
    const labelsToAdd: string[] = config.apply_labels
    const prHasAppliedLabels = labelsToAdd.length > 0 && labelsToAdd.every((label: string) => prLabels.includes(label))
    context.log('PR labels: %s, config apply labels: %s, condition passed: %s', prLabels, labelsToAdd, prHasAppliedLabels)
    if (prHasAppliedLabels) {
      context.log('PR has already labels to be added after approval. The PR might be already approved.')
      return
    }

    // reading pull request owner info and check it with configuration
    const prUser = pr.user.login
    const ownerSatisfied = config.from_owner.length === 0 || config.from_owner.includes(prUser)

    // reading pull request labels and check them with configuration
    const missingRequiredLabels = config.required_labels
      .filter((requiredLabel: any) => !prLabels.includes(requiredLabel))

    // determine if the PR has any "blacklisted" labels
    var blacklistedLabels: string[] = []
    if (config.blacklisted_labels) {
      blacklistedLabels = config.blacklisted_labels
        .filter((blacklistedLabel: any) => prLabels.includes(blacklistedLabel))
    }

    if (missingRequiredLabels.length === 0 && ownerSatisfied && blacklistedLabels.length === 0) {
      const prParams = context.issue({ event: 'APPROVE', body: 'Approved :+1:' })

      await context.github.pullRequests.createReview(prParams as PullRequestsCreateReviewParams)

      // if there are labels required to be added, add them
      if (labelsToAdd.length > 0) {
        // trying to apply existing labels to PR. If labels didn't exist, this call will fail
        const labels = context.issue({ labels: labelsToAdd })
        await context.github.issues.addLabels(labels as IssuesAddLabelsParams)
      }
    } else {
      // one of the ckecks failed
      context.log('Condition failed! \n - missing required labels: %s\n - PR owner found: %s', missingRequiredLabels, ownerSatisfied)
    }
  })
}