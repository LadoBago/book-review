using BookReview.Application.DTOs;
using BookReview.Application.Validators;

namespace BookReview.Application.Tests;

public class ValidatorTests
{
    private readonly CreateReviewRequestValidator _createValidator = new();
    private readonly UpdateReviewRequestValidator _updateValidator = new();

    [Fact]
    public void CreateValidator_ValidRequest_Passes()
    {
        var request = new CreateReviewRequest
        {
            Title = "Valid Title",
            Body = "Valid body content",
            Status = "Draft",
            Quotes = ["A good quote"]
        };

        var result = _createValidator.Validate(request);

        Assert.True(result.IsValid);
    }

    [Fact]
    public void CreateValidator_EmptyTitle_Fails()
    {
        var request = new CreateReviewRequest { Title = "", Body = "Body" };

        var result = _createValidator.Validate(request);

        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, e => e.PropertyName == "Title");
    }

    [Fact]
    public void CreateValidator_TitleTooLong_Fails()
    {
        var request = new CreateReviewRequest { Title = new string('x', 201), Body = "Body" };

        var result = _createValidator.Validate(request);

        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, e => e.PropertyName == "Title");
    }

    [Fact]
    public void CreateValidator_EmptyBody_Fails()
    {
        var request = new CreateReviewRequest { Title = "Title", Body = "" };

        var result = _createValidator.Validate(request);

        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, e => e.PropertyName == "Body");
    }

    [Fact]
    public void CreateValidator_InvalidStatus_Fails()
    {
        var request = new CreateReviewRequest { Title = "Title", Body = "Body", Status = "Invalid" };

        var result = _createValidator.Validate(request);

        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, e => e.PropertyName == "Status");
    }

    [Fact]
    public void CreateValidator_TooManyQuotes_Fails()
    {
        var quotes = Enumerable.Range(0, 51).Select(i => $"Quote {i}").ToList();
        var request = new CreateReviewRequest { Title = "Title", Body = "Body", Quotes = quotes };

        var result = _createValidator.Validate(request);

        Assert.False(result.IsValid);
    }

    [Fact]
    public void CreateValidator_QuoteTooLong_Fails()
    {
        var request = new CreateReviewRequest
        {
            Title = "Title",
            Body = "Body",
            Quotes = [new string('x', 501)]
        };

        var result = _createValidator.Validate(request);

        Assert.False(result.IsValid);
    }

    [Fact]
    public void UpdateValidator_NullFields_Passes()
    {
        var request = new UpdateReviewRequest();

        var result = _updateValidator.Validate(request);

        Assert.True(result.IsValid);
    }

    [Fact]
    public void UpdateValidator_EmptyTitle_Fails()
    {
        var request = new UpdateReviewRequest { Title = "" };

        var result = _updateValidator.Validate(request);

        Assert.False(result.IsValid);
    }

    [Fact]
    public void UpdateValidator_ValidStatus_Passes()
    {
        var request = new UpdateReviewRequest { Status = "Published" };

        var result = _updateValidator.Validate(request);

        Assert.True(result.IsValid);
    }
}
