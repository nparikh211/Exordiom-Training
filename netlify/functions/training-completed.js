exports.handler = async function(event, context) {
  try {
    // Parse the request body
    const data = JSON.parse(event.body);
    const { firstName, lastName, email, attemptCount, completionDate } = data;
    
    // Validate required fields
    if (!email) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: 'Email is required' })
      };
    }
    
    // Format the completion date nicely
    const formattedDate = new Date(completionDate).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
    
    // Create email content
    const emailContent = `
      <h1>Training Completion Notification</h1>
      <p>A user has completed the Exordiom Talent Training program.</p>
      
      <h2>User Details:</h2>
      <ul>
        <li><strong>Name:</strong> ${firstName || ''} ${lastName || ''}</li>
        <li><strong>Email:</strong> ${email}</li>
        <li><strong>Attempt Count:</strong> ${attemptCount}</li>
        <li><strong>Completion Date:</strong> ${formattedDate}</li>
      </ul>
      
      <p>The user has successfully passed all required training modules and the assessment quiz.</p>
    `;
    
    // Send the email
    // In a real implementation, you would use an email service like SendGrid, Mailgun, etc.
    console.log('Training completion email would be sent with:', {
      to: 'neej@exordiom.com', // Admin email
      subject: 'Training Completion: ' + (firstName || '') + ' ' + (lastName || ''),
      html: emailContent
    });
    
    // For demonstration purposes, we'll just return success
    return {
      statusCode: 200,
      body: JSON.stringify({ 
        message: 'Notification sent successfully',
        recipient: 'neej@exordiom.com'
      })
    };
  } catch (error) {
    console.error('Error in training-completed function:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Internal server error' + error.message })
    };
  }
};